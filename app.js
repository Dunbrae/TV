import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyD-JxB_5oXn0_mK_yoRl9SzuZxH_Qw0rSY",
  authDomain: "tv-display-dunbrae.firebaseapp.com",
  databaseURL: "https://tv-display-dunbrae-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "tv-display-dunbrae",
  storageBucket: "tv-display-dunbrae.firebasestorage.app",
  messagingSenderId: "21582548634",
  appId: "1:21582548634:web:463c8aa934e5991a59d923"
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

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
let isCarouselMode = localStorage.getItem('tv-display-mode') !== 'scroll';
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

function normalizeWeekTitle(title) {
  if (typeof title !== 'string') {
    return '';
  }

  const match = title.match(/^Target for Fiscal Week (\d+) \(FY\d+\)$/i);
  if (match) {
    return `Target for Week ${match[1]}`;
  }

  return title;
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
  ].every((value) => value === null || value === undefined || value === '');
}

function setDashboardVisibility(hasData) {
  if (loadingStateContainer) {
    loadingStateContainer.classList.add('hidden');
  }

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
    'month-as-of',
    'week-title',
    'week-range',
    'month-invoiced',
    'month-target',
    'month-percent',
    'week-invoiced',
    'week-target',
    'week-percent',
    'month-donut-label',
  ].forEach((id) => setText(id, ''));

  setText('page-title', 'Dashboard');

  setDonut('month-donut-ring', 0);
  setDonut('week-donut-ring', 0);
}

function resetCarouselProgress() {
  const bar = document.getElementById('carousel-progress');
  if (!bar) return;
  
  bar.style.transition = 'none';
  bar.style.width = '0%';
  
  if (isCarouselMode) {
    // Force a browser reflow to apply the 0% immediately
    void bar.offsetWidth;
    
    // Start linear transition for exactly 15s
    bar.style.transition = 'width 15s linear';
    bar.style.width = '100%';
  }
}

function applyCarouselState() {
  const dashboardCards = carouselCards.length ? carouselCards : [];

  if (!dashboardCards.length) {
    return;
  }
  
  resetCarouselProgress();

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

  const monthPercent = normalizePercent(data.mtdPercent, data.monthTarget, data.monthInvoiced);
  const weekPercent = normalizePercent(data.weeksPercent, data.weekTarget, data.weekInvoiced);

  setText('page-title', data.dashboardTitle || 'Dashboard');
  setText('month-range', data.monthRange || '');
  // Use yesterday's date for the 'As of' badge
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const formattedAsOf = formatHumanDate(d);
  setText('month-as-of', formattedAsOf);
  setText('week-title', normalizeWeekTitle(data.weekTitle) || 'Weekly Summary');
  setText('week-range', data.weekRange || '');

  document.getElementById('month-invoiced').textContent = formatCurrency(data.monthInvoiced);
  document.getElementById('month-target').textContent = formatCurrency(data.monthTarget);
  document.getElementById('month-percent').textContent = formatPercent(monthPercent);
  setDonut('month-donut-ring', monthPercent);

  document.getElementById('week-invoiced').textContent = formatCurrency(data.weekInvoiced);
  document.getElementById('week-target').textContent = formatCurrency(data.weekTarget);
  document.getElementById('week-percent').textContent = formatPercent(weekPercent);
  setDonut('week-donut-ring', weekPercent);

  setText('month-donut-label', data.monthLabel || 'Month');
}

function formatHumanDate(d) {
  try {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return '';
  }
}

function loadData() {
  const metricsRef = ref(database, 'metrics');
  onValue(metricsRef, (snapshot) => {
    try {
      const data = snapshot.val() || {};
      render(data);
    } catch (error) {
      console.error('Failed to parse dashboard data:', error);
      setText('mode-status', 'Dashboard data error');
    }
  }, (error) => {
    console.error('Failed to load dashboard data:', error);
    setText('mode-status', 'Dashboard data unavailable');
  });
}

modeToggleButton.addEventListener('click', toggleCarouselMode);
applyCarouselState();
startCarouselTimer();
loadData();