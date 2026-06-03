import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js';
import { getDatabase, ref, get, set } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js';

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

let currentData = null;

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-message');
  const iconEl = document.getElementById('toast-icon');

  if (!toast || !msgEl || !iconEl) return;

  msgEl.textContent = message;

  if (type === 'success') {
    iconEl.innerHTML = `
      <svg class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    `;
  } else if (type === 'error') {
    iconEl.innerHTML = `
      <svg class="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    `;
  } else {
    iconEl.innerHTML = `
      <svg class="w-5 h-5 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
      </svg>
    `;
  }

  toast.classList.remove('translate-y-12', 'opacity-0', 'pointer-events-none');
  toast.classList.add('translate-y-0', 'opacity-100');

  if (type !== 'info') {
    if (window.toastTimeout) clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
      hideToast();
    }, 4000);
  }
}

function hideToast() {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-12', 'opacity-0', 'pointer-events-none');
  }
}

function requireData() {
  if (!currentData) {
    throw new Error('No dashboard data loaded yet.');
  }
}

function readNumber(input) {
  if (!input) return null;
  const value = input.value.trim().replace(/,/g, '');
  return value === '' ? null : Number(value);
}

function formatNumberValue(value) {
  if (!value && value !== 0) return '';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString('en-US');
}

function updateDashboardTitleDisplay() {
  const startInput = document.querySelector('[data-path="monthStart"]');
  const sel = document.querySelector('[data-path="monthLabel"]');
  const dashboardDisplay = document.getElementById('dashboardTitleDisplay');
  const hiddenTitle = document.querySelector('[data-path="dashboardTitle"]');

  const computeMonthName = () => {
    if (sel && sel.value) {
      return sel.value;
    }
    const s = startInput?.value;
    if (s) {
      const d = new Date(s);
      if (!Number.isNaN(d.getTime())) {
        const utcDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
        return utcDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
    }
    return '';
  };

  const monthName = computeMonthName();
  const titleText = monthName ? `Target for the month of ${monthName}` : 'Target for the month of —';
  if (dashboardDisplay) dashboardDisplay.textContent = titleText;
  if (hiddenTitle) hiddenTitle.value = titleText;
}

function populateForm(data) {
  requireData();

  document.querySelector('[data-path="dashboardTitle"]').value = data.dashboardTitle ?? '';
  
  const startInput = document.querySelector('[data-path="monthStart"]');
  const endInput = document.querySelector('[data-path="monthEnd"]');
  
  const parseToISO = (text) => {
    if (!text) return '';
    const parts = String(text).split(' - ').map((p) => p.trim());
    const pick = parts[0] || text;
    const d = new Date(pick);
    if (Number.isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  if (startInput && endInput) {
    startInput.value = parseToISO(data.monthRange) || (data.monthStart ? parseToISO(data.monthStart) : '');
    
    const endIso = (function(){
      if (data.monthRange) {
        const parts = String(data.monthRange).split(' - ').map((p) => p.trim());
        if (parts[1]) {
          const d = new Date(parts[1]);
          if (!Number.isNaN(d.getTime())) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
          }
        }
      }
      return data.monthEnd ? parseToISO(data.monthEnd) : '';
    })();

    endInput.value = endIso || '';
  }

  const monthSelect = document.querySelector('[data-path="monthLabel"]');
  const months = Array.from(monthSelect.options).map((o) => o.value || o.text).filter(Boolean);

  monthSelect.value = data.monthLabel && months.includes(data.monthLabel) ? data.monthLabel : '';

  const wsEl = document.querySelector('[data-path="weekStart"]');
  const weEl = document.querySelector('[data-path="weekEnd"]');

  if (data.weekStart && data.weekEnd) {
    wsEl.value = data.weekStart;
    weEl.value = data.weekEnd;
  } else if (data.weekPicker && data.weekPicker.includes('-W')) {
    const [yearStr, weekStr] = data.weekPicker.split('-W');
    const year = Number(yearStr);
    const week = Number(weekStr);
    if (year && week) {
      const jan4 = new Date(Date.UTC(year, 0, 4));
      const dayOfWeek = jan4.getUTCDay() || 7;
      const monday = new Date(Date.UTC(year, 0, 4 - (dayOfWeek - 1) + (week - 1) * 7));
      wsEl.value = monday.toISOString().slice(0, 10);
      weEl.value = new Date(monday.getTime() + 6 * 86400000).toISOString().slice(0, 10);
    }
  } else if (data.weekRange) {
    const parts = String(data.weekRange).split(' - ').map((p) => p.trim());
    const d = new Date(parts[0]);
    if (!Number.isNaN(d.getTime())) {
      wsEl.value = d.toISOString().slice(0, 10);
    }
    if (parts[1]) {
      const d2 = new Date(parts[1]);
      if (!Number.isNaN(d2.getTime())) {
        weEl.value = d2.toISOString().slice(0, 10);
      }
    }
  }

  updateFiscalDisplay();

  document.querySelector('[data-path="monthInvoiced"]').value = formatNumberValue(data.monthInvoiced);
  document.querySelector('[data-path="monthTarget"]').value = formatNumberValue(data.monthTarget);
  document.querySelector('[data-path="weekInvoiced"]').value = formatNumberValue(data.weekInvoiced);
  document.querySelector('[data-path="weekTarget"]').value = formatNumberValue(data.weekTarget);
  document.querySelector('[data-path="weeksPercent"]').value = data.weeksPercent ?? '';
  document.querySelector('[data-path="mtdPercent"]').value = data.mtdPercent ?? '';
  
  updateDashboardTitleDisplay();
}

function collectPayload() {
  const payload = {
    dashboardTitle: document.querySelector('[data-path="dashboardTitle"]')?.value.trim() || '',
    monthRange: (function(){
      const s = document.querySelector('[data-path="monthStart"]')?.value || '';
      const e = document.querySelector('[data-path="monthEnd"]')?.value || '';
      if (!s && !e) return '';
      const parseAndFormat = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        const utcDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
        return utcDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      };
      const startText = parseAndFormat(s);
      const endText = parseAndFormat(e);
      if (startText && endText) return `${startText} - ${endText}`;
      return startText || endText || '';
    })(),
    monthLabel: document.querySelector('[data-path="monthLabel"]')?.value.trim(),
    weekStart: document.querySelector('[data-path="weekStart"]')?.value || '',
    weekEnd: document.querySelector('[data-path="weekEnd"]')?.value || '',
    weekTitle: (function(){
      const ws = document.querySelector('[data-path="weekStart"]')?.value;
      const we = document.querySelector('[data-path="weekEnd"]')?.value;
      if (!ws || !we) return '';
      const d = new Date(ws);
      if (Number.isNaN(d.getTime())) return '';
      const dayNum = d.getUTCDay() || 7;
      const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - (dayNum - 1)));
      const month = monday.getUTCMonth();
      const calYear = monday.getUTCFullYear();
      const fiscalYearEnd = month >= 6 ? calYear + 1 : calYear;
      const fiscalYearStart = fiscalYearEnd - 1;
      const july1 = new Date(Date.UTC(fiscalYearStart, 6, 1));
      const july1Day = july1.getUTCDay() || 7;
      const fyStart = new Date(Date.UTC(fiscalYearStart, 6, 1 - (july1Day - 1)));
      const diffMs = monday.getTime() - fyStart.getTime();
      const fw = Math.floor(diffMs / (7 * 86400000)) + 1;
      return `Target for Week ${fw}`;
    })(),
    weekRange: (function(){
      const ws = document.querySelector('[data-path="weekStart"]')?.value;
      const we = document.querySelector('[data-path="weekEnd"]')?.value;
      if (!ws || !we) return '';
      const fmt = (iso) => {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        const utcDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
        return utcDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      };
      const startText = fmt(ws);
      const endText = fmt(we);
      if (startText && endText) return `${startText} - ${endText}`;
      return startText || endText || '';
    })(),
    monthInvoiced: readNumber(document.querySelector('[data-path="monthInvoiced"]')),
    monthTarget: readNumber(document.querySelector('[data-path="monthTarget"]')),
    weekInvoiced: readNumber(document.querySelector('[data-path="weekInvoiced"]')),
    weekTarget: readNumber(document.querySelector('[data-path="weekTarget"]')),
    weeksPercent: readNumber(document.querySelector('[data-path="weeksPercent"]')),
    mtdPercent: readNumber(document.querySelector('[data-path="mtdPercent"]')),
  };

  return payload;
}

function syncWeekRange() {
  const wsEl = document.querySelector('[data-path="weekStart"]');
  const weEl = document.querySelector('[data-path="weekEnd"]');
  if (!wsEl || !weEl) return;
  if (wsEl.value && !weEl.value) {
    const d = new Date(wsEl.value);
    if (!Number.isNaN(d.getTime())) {
      weEl.value = new Date(d.getTime() + 6 * 86400000).toISOString().slice(0, 10);
    }
  } else if (weEl.value && !wsEl.value) {
    const d = new Date(weEl.value);
    if (!Number.isNaN(d.getTime())) {
      wsEl.value = new Date(d.getTime() - 6 * 86400000).toISOString().slice(0, 10);
    }
  }
}

function getFiscalWeek(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;

  const dayNum = d.getUTCDay() || 7;
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - (dayNum - 1)));
  const month = monday.getUTCMonth();
  const calYear = monday.getUTCFullYear();
  const fiscalYearEnd = month >= 6 ? calYear + 1 : calYear;
  const fiscalYearStart = fiscalYearEnd - 1;
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const july1 = new Date(Date.UTC(fiscalYearStart, 6, 1));
  const july1Day = july1.getUTCDay() || 7;
  const fyStart = new Date(Date.UTC(fiscalYearStart, 6, 1 - (july1Day - 1)));
  const diffMs = monday.getTime() - fyStart.getTime();
  return Math.floor(diffMs / msPerWeek) + 1;
}

function updateFiscalDisplay() {
  const wsEl = document.querySelector('[data-path="weekStart"]');
  const display = document.getElementById('fiscal-week-number');
  if (!wsEl || !display) return;
  const fw = getFiscalWeek(wsEl.value);
  display.textContent = fw ? `Week ${fw}` : 'Week --';
}

async function loadDashboard() {
  const snapshot = await get(ref(database, 'metrics'));
  currentData = snapshot.val() || {};
  populateForm(currentData);
}

async function saveChanges(event) {
  event.preventDefault();

  showToast('Saving changes...', 'info');

  try {
    const payload = collectPayload();
    await set(ref(database, 'metrics'), payload);

    currentData = payload;
    const now = new Date();
    showToast(`Saved successfully at ${now.toLocaleTimeString()}`, 'success');
  } catch (error) {
    showToast(error.message || 'Save failed.', 'error');
  }
}

async function clearAllData() {
  const isConfirmed = window.confirm('Are you sure you want to completely delete all data? This will instantly clear the TV display and cannot be undone.');
  
  if (!isConfirmed) {
    return;
  }

  showToast('Clearing all data...', 'info');

  try {
    await set(ref(database, 'metrics'), null);
    currentData = {};
    populateForm({});
    showToast('All data cleared successfully.', 'success');
  } catch (error) {
    showToast(error.message || 'Failed to clear data.', 'error');
  }
}

async function bootstrap() {
  document.getElementById('editor-form').addEventListener('submit', saveChanges);
  
  const clearButton = document.getElementById('clear-data-button');
  if (clearButton) {
    clearButton.addEventListener('click', clearAllData);
  }

  const monthSelect = document.querySelector('[data-path="monthLabel"]');
  if (monthSelect) {
    monthSelect.addEventListener('change', updateDashboardTitleDisplay);
  }

  const monthStartInput = document.querySelector('[data-path="monthStart"]');
  if (monthStartInput) {
    monthStartInput.addEventListener('change', updateDashboardTitleDisplay);
  }

  const numberInputs = ['monthInvoiced', 'monthTarget', 'weekInvoiced', 'weekTarget'];
  numberInputs.forEach((path) => {
    const el = document.querySelector(`[data-path="${path}"]`);
    if (el) {
      el.addEventListener('input', () => {
        const cursor = el.selectionStart;
        const raw = el.value.replace(/,/g, '');
        const lenBefore = el.value.length;
        el.value = formatNumberValue(raw);
        const lenAfter = el.value.length;
        const offset = cursor + (lenAfter - lenBefore);
        el.setSelectionRange(offset, offset);
      });
      el.addEventListener('input', autoCalcPercent);
    }
  });

  function autoCalcPercent() {
    const calc = (invoicedPath, targetPath, percentPath) => {
      const inv = document.querySelector(`[data-path="${invoicedPath}"]`);
      const tgt = document.querySelector(`[data-path="${targetPath}"]`);
      const pct = document.querySelector(`[data-path="${percentPath}"]`);
      if (!inv || !tgt || !pct) return;
      const invoiced = Number(inv.value.replace(/,/g, ''));
      const target = Number(tgt.value.replace(/,/g, ''));
      if (target > 0) {
        const val = Math.round((invoiced / target) * 100);
        pct.value = String(val);
      }
    };
    calc('monthInvoiced', 'monthTarget', 'mtdPercent');
    calc('weekInvoiced', 'weekTarget', 'weeksPercent');
  }

  const wsEl = document.querySelector('[data-path="weekStart"]');
  const weEl = document.querySelector('[data-path="weekEnd"]');
  [wsEl, weEl].forEach((el) => {
    if (el) {
      el.addEventListener('change', () => {
        syncWeekRange();
        updateFiscalDisplay();
      });
    }
  });

  document.addEventListener('keydown', (e) => {
    const isSave = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's';
    if (isSave) {
      const form = document.getElementById('editor-form');
      if (form) {
        e.preventDefault();
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }
  });

  try {
    await loadDashboard();
  } catch (error) {
    showToast('Failed to load initial data.', 'error');
  }
}

bootstrap();