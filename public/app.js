const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

const carouselCards = Array.from(document.querySelectorAll('[data-carousel-card]'));
const modeToggleButton = document.getElementById('mode-toggle');
const modeStatus = document.getElementById('mode-status');
const dashboardCardsContainer = document.getElementById('dashboard-cards');
const emptyStateContainer = document.getElementById('empty-state');

let isCarouselMode = localStorage.getItem('tv-display-mode') === 'carousel';
let carouselIndex = 0;
let carouselTimer = null;

function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '$0';
  }

  return currencyFormatter.format(Number(value));
}

function formatPercent(value) {
  const numberValue = Number(value) || 0;
  return `${percentFormatter.format(numberValue)}%`;
}

function normalizePercent(value, target, invoiced) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.min(100, value));
  }

  const fallbackTarget = Number(target) || 0;
  const fallbackInvoiced = Number(invoiced) || 0;

  if (!fallbackTarget) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((fallbackInvoiced / fallbackTarget) * 100)));
}

function setDonut(element, percent) {
  element.style.setProperty('--percent', String(percent));
}

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function isEmptyData(data) {
  if (!data || typeof data !== 'object') {
    return true;
  }

  return [
    data.dashboardTitle,
    data.monthRange,
    data.weekTitle,
    data.weekRange,
    data.monthInvoiced,
    data.monthTarget,
    data.weekInvoiced,
    data.weekTarget,
    data.mtdInvoiced,
    data.target,
    data.dailyTarget,
  ].every((value) => value === null || value === undefined || value === '');
}

function setDashboardVisibility(hasData) {
  if (dashboardCardsContainer) {
    dashboardCardsContainer.classList.toggle('hidden', !hasData);
  }

  if (emptyStateContainer) {
    emptyStateContainer.classList.toggle('hidden', hasData);
  }
}

function clearDashboardValues() {
  [
    'page-title',
    'month-range',
    'week-title',
    'week-range',
    'month-invoiced',
    'month-target',
    'month-percent',
    'week-invoiced',
    'week-target',
    'week-percent',
    'weeks-percent',
    'mtd-percent',
    'mtd-invoiced',
    'mtd-target',
    'daily-target',
    'daily-target-value',
    'weekly-section-title',
    'month-donut-label',
    'week-donut-label',
  ].forEach((id) => setText(id, ''));

  // Keep a stable page title when the dashboard is empty
  setText('page-title', 'Dashboard');

  setDonut(document.getElementById('month-donut'), 0);
  setDonut(document.getElementById('week-donut'), 0);

  const tableBody = document.getElementById('weekly-table');
  if (tableBody) {
    tableBody.innerHTML = '';
  }
}

function applyCarouselState() {
  const dashboardCards = carouselCards.length ? carouselCards : [];

  if (!dashboardCards.length) {
    return;
  }

  if (isCarouselMode) {
    dashboardCards.forEach((card, index) => {
      card.classList.toggle('hidden', index !== carouselIndex);
    });

    document.body.classList.add('overflow-hidden');
    modeToggleButton.textContent = 'Scroll mode';
    modeStatus.textContent = `Carousel mode: card ${carouselIndex + 1} of ${dashboardCards.length}`;
  } else {
    dashboardCards.forEach((card) => card.classList.remove('hidden'));

    document.body.classList.remove('overflow-hidden');
    modeToggleButton.textContent = 'Carousel mode';
    modeStatus.textContent = 'Scroll mode';
  }
}

function advanceCarousel() {
  if (!isCarouselMode || !carouselCards.length) {
    return;
  }

  carouselIndex = (carouselIndex + 1) % carouselCards.length;
  applyCarouselState();
}

function startCarouselTimer() {
  stopCarouselTimer();

  if (isCarouselMode) {
    carouselTimer = window.setInterval(advanceCarousel, 15000);
  }
}

function stopCarouselTimer() {
  if (carouselTimer !== null) {
    window.clearInterval(carouselTimer);
    carouselTimer = null;
  }
}

function toggleCarouselMode() {
  isCarouselMode = !isCarouselMode;
  localStorage.setItem('tv-display-mode', isCarouselMode ? 'carousel' : 'scroll');

  if (isCarouselMode) {
    carouselIndex = 0;
    applyCarouselState();
    startCarouselTimer();
  } else {
    stopCarouselTimer();
    applyCarouselState();
  }
}

function pickLatestWeek(data) {
  const weeklyData = Array.isArray(data.weeklyData) ? data.weeklyData : [];
  return weeklyData.find((week) => week.percent > 0) || weeklyData[weeklyData.length - 1] || null;
}

function render(data) {
  const hasData = !isEmptyData(data);

  setDashboardVisibility(hasData);

  if (!hasData) {
    clearDashboardValues();
    setText('mode-status', 'Empty state');
    stopCarouselTimer();
    applyCarouselState();
    return;
  }

  const monthPercent = normalizePercent(data.mtdPercent, data.target, data.mtdInvoiced);
  const weekPercent = normalizePercent(data.weeksPercent, data.weekTarget, data.weekInvoiced);
  const activeWeek = pickLatestWeek(data);

  setText('page-title', data.dashboardTitle || 'Dashboard');
  setText('month-range', data.monthRange || '');
  setText('week-title', data.weekTitle || (activeWeek ? `Target for ${activeWeek.week}` : 'Weekly Summary'));
  setText('week-range', data.weekRange || (activeWeek ? `${activeWeek.start} - ${activeWeek.end}` : ''));

  document.getElementById('month-invoiced').textContent = formatCurrency(data.monthInvoiced);
  document.getElementById('month-target').textContent = formatCurrency(data.monthTarget);
  document.getElementById('month-percent').textContent = formatPercent(monthPercent);
  setDonut(document.getElementById('month-donut'), monthPercent);

  document.getElementById('week-invoiced').textContent = formatCurrency(data.weekInvoiced);
  document.getElementById('week-target').textContent = formatCurrency(data.weekTarget);
  document.getElementById('week-percent').textContent = formatPercent(weekPercent);
  setDonut(document.getElementById('week-donut'), weekPercent);

  document.getElementById('weeks-percent').textContent = formatPercent(data.weeksPercent);
  document.getElementById('mtd-percent').textContent = formatPercent(data.mtdPercent);
  document.getElementById('mtd-invoiced').textContent = formatCurrency(data.mtdInvoiced);
  document.getElementById('mtd-target').textContent = formatCurrency(data.target);
  document.getElementById('daily-target-value').textContent = formatCurrency(data.dailyTarget);
  document.getElementById('daily-target').textContent = `Daily target: ${formatCurrency(data.dailyTarget)}`;
  setText('weekly-section-title', data.weeklySectionTitle || 'Weekly Breakdown');
  setText('month-donut-label', data.monthLabel || 'Month');
  setText('week-donut-label', data.weekLabel || 'Week');

  const rows = Array.isArray(data.weeklyData) ? data.weeklyData : [];
  const tableBody = document.getElementById('weekly-table');

  if (!rows.length) {
    tableBody.innerHTML = `
      <tr>
        <td class="border-2 border-[#3d3d3d] px-3 py-6 text-center font-bold text-slate-500" colspan="6">No weekly data yet.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = rows
    .map(
      (row) => `
        <tr class="odd:bg-slate-50">
          <td class="border-2 border-[#3d3d3d] px-3 py-2 font-bold">${row.week ?? ''}</td>
          <td class="border-2 border-[#3d3d3d] px-3 py-2 font-bold">${row.start ?? ''}</td>
          <td class="border-2 border-[#3d3d3d] px-3 py-2 font-bold">${row.end ?? ''}</td>
          <td class="border-2 border-[#3d3d3d] px-3 py-2 text-right font-bold">${formatCurrency(row.target)}</td>
          <td class="border-2 border-[#3d3d3d] px-3 py-2 text-right font-bold">${row.invoiced === null ? '' : formatCurrency(row.invoiced)}</td>
          <td class="border-2 border-[#3d3d3d] px-3 py-2 text-right font-bold">${formatPercent(row.percent)}</td>
        </tr>
      `,
    )
    .join('');
}

async function loadData() {
  try {
    const response = await fetch('/api/metrics', { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    const data = await response.json();
    render(data);
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    setText('mode-status', 'Dashboard data unavailable');
  }
}

modeToggleButton.addEventListener('click', toggleCarouselMode);
applyCarouselState();
startCarouselTimer();
loadData();
setInterval(loadData, 10000);