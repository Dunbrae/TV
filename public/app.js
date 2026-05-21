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
const loadingStateContainer = document.getElementById('loading-state');
const tableCard = document.querySelector('[data-carousel-card="table"]');

let isCarouselMode = localStorage.getItem('tv-display-mode') === 'carousel';
let carouselIndex = 0;
let carouselTimer = null;

function formatCurrency(value) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) {
    return '$0';
  }

  return currencyFormatter.format(Number(value));
}

function formatPercent(value) {
  const numberValue = Number(value) || 0;
  return `${percentFormatter.format(numberValue)}%`;
}

function normalizePercent(value, target, invoiced) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.max(0, Math.min(100, value));
  }

  const fallbackTarget = Number(target) || 0;
  const fallbackInvoiced = Number(invoiced) || 0;

  if (!fallbackTarget) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((fallbackInvoiced / fallbackTarget) * 100)));
}

function setDonut(ringId, percent) {
  const ring = document.getElementById(ringId);
  if (ring) {
    const percentVal = Math.max(0, Math.min(100, Number(percent) || 0));
    const circumference = 251.2;
    const offset = circumference - (circumference * percentVal) / 100;
    ring.style.strokeDashoffset = String(offset);
  }
}

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value || '';
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
  if (loadingStateContainer) {
    loadingStateContainer.classList.add('hidden');
  }

  if (dashboardCardsContainer) {
    dashboardCardsContainer.classList.toggle('hidden', !hasData);
  }

  if (tableCard) {
    tableCard.classList.toggle('hidden', !hasData);
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

  setText('page-title', 'Dashboard');

  setDonut('month-donut-ring', 0);
  setDonut('week-donut-ring', 0);

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
      if (index === carouselIndex) {
        card.classList.remove('hidden');
        card.classList.remove('opacity-0');
        card.classList.add('opacity-100');
      } else {
        card.classList.add('hidden');
        card.classList.remove('opacity-100');
        card.classList.add('opacity-0');
      }
    });

    document.body.classList.add('overflow-hidden');
    modeToggleButton.innerHTML = `
      <svg class="w-4.5 h-4.5 text-indigo-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      Scroll mode
    `;
    modeStatus.textContent = `Carousel mode: card ${carouselIndex + 1} of ${dashboardCards.length}`;
  } else {
    dashboardCards.forEach((card) => {
      card.classList.remove('hidden');
      card.classList.remove('opacity-0');
      card.classList.add('opacity-100');
    });

    document.body.classList.remove('overflow-hidden');
    modeToggleButton.innerHTML = `
      <svg class="w-4.5 h-4.5 text-indigo-750" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
      </svg>
      Carousel mode
    `;
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
  setDonut('month-donut-ring', monthPercent);

  document.getElementById('week-invoiced').textContent = formatCurrency(data.weekInvoiced);
  document.getElementById('week-target').textContent = formatCurrency(data.weekTarget);
  document.getElementById('week-percent').textContent = formatPercent(weekPercent);
  setDonut('week-donut-ring', weekPercent);

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
        <td class="px-6 py-8 text-center font-bold text-slate-500" colspan="6">No weekly data yet.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = rows
    .map(
      (row) => `
        <tr class="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
          <td class="py-4.5 px-6 font-bold text-slate-900">${row.week ?? ''}</td>
          <td class="py-4.5 px-6 text-slate-600 font-medium">${row.start ?? ''}</td>
          <td class="py-4.5 px-6 text-slate-600 font-medium">${row.end ?? ''}</td>
          <td class="py-4.5 px-6 text-right font-bold text-slate-700">${formatCurrency(row.target)}</td>
          <td class="py-4.5 px-6 text-right font-bold text-indigo-700">${row.invoiced === null ? '' : formatCurrency(row.invoiced)}</td>
          <td class="py-4.5 px-6 text-right font-black text-slate-900">${formatPercent(row.percent)}</td>
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