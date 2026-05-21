const tokenKey = 'tv-display-admin-token';

let sessionToken = localStorage.getItem(tokenKey) || '';
let currentData = null;

const defaultWeeklyRow = {
  week: '',
  start: '',
  end: '',
  target: '',
  invoiced: '',
  percent: '',
};

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

function getAuthHeaders() {
  return sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
}

function readNumber(input) {
  if (!input) return null;
  const value = input.value.trim();
  return value === '' ? null : Number(value);
}

function readWeeklyRows() {
  return Array.from(document.querySelectorAll('#weekly-editor tr')).map((row) => {
    const fields = row.querySelectorAll('input');

    return {
      week: fields[0].value,
      start: fields[1].value,
      end: fields[2].value,
      target: readNumber(fields[3]),
      invoiced: fields[4].value.trim() === '' ? null : Number(fields[4].value),
      percent: readNumber(fields[5]) ?? 0,
    };
  });
}

function renderWeeklyRows(rows) {
  const table = document.getElementById('weekly-editor');

  table.innerHTML = rows
    .map(
      (row, index) => `
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="px-4 py-3"><input data-row="${index}" data-field="week" value="${row.week ?? ''}" placeholder="e.g. Week 19" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" /></td>
          <td class="px-4 py-3"><input data-row="${index}" data-field="start" type="date" value="${row.start ?? ''}" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer" /></td>
          <td class="px-4 py-3"><input data-row="${index}" data-field="end" type="date" value="${row.end ?? ''}" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer" /></td>
          <td class="px-4 py-3"><input data-row="${index}" data-field="target" type="number" step="0.01" value="${row.target ?? ''}" placeholder="30000" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" /></td>
          <td class="px-4 py-3"><input data-row="${index}" data-field="invoiced" type="number" step="0.01" value="${row.invoiced ?? ''}" placeholder="31500" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" /></td>
          <td class="px-4 py-3"><input data-row="${index}" data-field="percent" type="number" step="1" value="${row.percent ?? ''}" placeholder="105" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" /></td>
          <td class="px-4 py-3 text-center">
            <button type="button" class="inline-flex items-center justify-center w-8.5 h-8.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-colors border border-rose-100" data-remove-row="${index}" title="Remove row">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </td>
        </tr>
      `,
    )
    .join('');

  document.querySelectorAll('[data-remove-row]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.getAttribute('data-remove-row'));
      const nextRows = readWeeklyRows();
      nextRows.splice(index, 1);
      renderWeeklyRows(nextRows);
    });
  });
}

function updateDashboardTitleDisplay() {
  const startInput = document.querySelector('[data-path="monthStart"]');
  const sel = document.querySelector('[data-path="monthLabel"]');
  const custom = document.querySelector('[data-path="monthLabelCustom"]');
  const dashboardDisplay = document.getElementById('dashboardTitleDisplay');
  const hiddenTitle = document.querySelector('[data-path="dashboardTitle"]');

  const computeMonthName = () => {
    if (sel && sel.value === '__custom' && custom && custom.value.trim()) {
      return custom.value.trim();
    }
    if (sel && sel.value && sel.value !== '__custom') {
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
  const monthCustom = document.querySelector('[data-path="monthLabelCustom"]');
  const months = Array.from(monthSelect.options).map((o) => o.value || o.text).filter(Boolean);

  if (data.monthLabel && months.includes(data.monthLabel)) {
    monthSelect.value = data.monthLabel;
    monthCustom.value = '';
    monthCustom.classList.add('hidden');
  } else if (data.monthLabel) {
    monthSelect.value = '__custom';
    monthCustom.value = data.monthLabel;
    monthCustom.classList.remove('hidden');
  } else {
    monthSelect.value = '';
    monthCustom.value = '';
    monthCustom.classList.add('hidden');
  }

  document.querySelector('[data-path="weekTitle"]').value = data.weekTitle ?? '';
  
  const weekPicker = document.querySelector('[data-path="weekPicker"]');
  if (weekPicker) {
    const inferWeek = (text) => {
      if (!text) return '';
      const parts = String(text).split(' - ').map((p) => p.trim());
      const d = new Date(parts[0]);
      if (Number.isNaN(d.getTime())) return '';
      const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const dayNum = tmp.getUTCDay() || 7;
      tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
      const year = tmp.getUTCFullYear();
      const yearStart = new Date(Date.UTC(year, 0, 1));
      const weekNo = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
      return `${year}-W${String(weekNo).padStart(2, '0')}`;
    };

    weekPicker.value = data.weekPicker || inferWeek(data.weekRange) || '';    
    const display = document.querySelector('[data-path="weekRangeDisplay"]');
    if (display) {
      display.value = computeWeekRangeFromPicker(weekPicker.value) || '';
    }
  }

  document.querySelector('[data-path="weekLabel"]').value = data.weekLabel ?? '';
  document.querySelector('[data-path="weeklySectionTitle"]').value = data.weeklySectionTitle ?? '';
  document.querySelector('[data-path="monthInvoiced"]').value = data.monthInvoiced ?? '';
  document.querySelector('[data-path="monthTarget"]').value = data.monthTarget ?? '';
  document.querySelector('[data-path="weekInvoiced"]').value = data.weekInvoiced ?? '';
  document.querySelector('[data-path="weekTarget"]').value = data.weekTarget ?? '';
  document.querySelector('[data-path="weeksPercent"]').value = data.weeksPercent ?? '';
  document.querySelector('[data-path="mtdPercent"]').value = data.mtdPercent ?? '';
  document.querySelector('[data-path="mtdInvoiced"]').value = data.mtdInvoiced ?? '';
  document.querySelector('[data-path="target"]').value = data.target ?? '';
  document.querySelector('[data-path="dailyTarget"]').value = data.dailyTarget ?? '';
  
  renderWeeklyRows(Array.isArray(data.weeklyData) ? data.weeklyData : []);
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
    monthLabel: (function(){
      const sel = document.querySelector('[data-path="monthLabel"]');
      const custom = document.querySelector('[data-path="monthLabelCustom"]');
      if (sel.value === '__custom') return custom.value.trim();
      return sel.value.trim();
    })(),
    weekTitle: (function(){
      const picker = document.querySelector('[data-path="weekPicker"]')?.value || '';
      if (!picker) return document.querySelector('[data-path="weekTitle"]')?.value.trim();
      const weekNum = picker.split('-W')[1];
      return `Target for Week ${weekNum}`;
    })(),
    weekRange: (function(){
      const w = document.querySelector('[data-path="weekPicker"]')?.value || '';
      if (!w) return '';
      const [yearStr, weekStr] = w.split('-W');
      const year = Number(yearStr);
      const week = Number(weekStr);
      if (!year || !week) return '';
      function getDateOfISOWeek(wk, yr) {
        const jan4 = new Date(Date.UTC(yr, 0, 4));
        const dayOfWeek = jan4.getUTCDay() || 7;
        return new Date(Date.UTC(yr, 0, 4 - (dayOfWeek - 1) + (wk - 1) * 7));
      }
      const start = getDateOfISOWeek(week, year);
      const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6));
      const format = (d) => {
        const utcDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
        return utcDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      };
      return `${format(start)} - ${format(end)}`;
    })(),
    weekLabel: document.querySelector('[data-path="weekLabel"]')?.value.trim(),
    weeklySectionTitle: document.querySelector('[data-path="weeklySectionTitle"]').value.trim(),
    monthInvoiced: readNumber(document.querySelector('[data-path="monthInvoiced"]')),
    monthTarget: readNumber(document.querySelector('[data-path="monthTarget"]')),
    weekInvoiced: readNumber(document.querySelector('[data-path="weekInvoiced"]')),
    weekTarget: readNumber(document.querySelector('[data-path="weekTarget"]')),
    weeksPercent: readNumber(document.querySelector('[data-path="weeksPercent"]')),
    mtdPercent: readNumber(document.querySelector('[data-path="mtdPercent"]')),
    mtdInvoiced: readNumber(document.querySelector('[data-path="mtdInvoiced"]')),
    target: readNumber(document.querySelector('[data-path="target"]')),
    dailyTarget: readNumber(document.querySelector('[data-path="dailyTarget"]')),
    weeklyData: readWeeklyRows(),
  };

  return payload;
}

function computeWeekRangeFromPicker(pickerValue) {
  if (!pickerValue) return '';
  const [yearStr, weekStr] = pickerValue.split('-W');
  const year = Number(yearStr);
  const week = Number(weekStr);
  if (!year || !week) return '';
  function getDateOfISOWeek(wk, yr) {
    const jan4 = new Date(Date.UTC(yr, 0, 4));
    const dayOfWeek = jan4.getUTCDay() || 7;
    return new Date(Date.UTC(yr, 0, 4 - (dayOfWeek - 1) + (wk - 1) * 7));
  }
  const start = getDateOfISOWeek(week, year);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6));
  const format = (d) => {
    const utcDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
    return utcDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };
  return `${format(start)} - ${format(end)}`;
}

async function loadDashboard() {
  const response = await fetch('/api/metrics', {
    cache: 'no-store',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to load dashboard data (${response.status}).`);
  }

  currentData = await response.json();
  populateForm(currentData);
}

async function login(event) {
  event.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  showToast('Signing in...', 'info');

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error('Invalid username or password.');
    }

    const data = await response.json();
    sessionToken = data.token;
    localStorage.setItem(tokenKey, sessionToken);

    document.getElementById('login-panel').classList.add('hidden');
    document.getElementById('editor-panel').classList.remove('hidden');
    showToast('Signed in successfully!', 'success');
    await loadDashboard();
  } catch (error) {
    showToast(error.message || 'Login failed.', 'error');
  }
}

async function saveChanges(event) {
  event.preventDefault();

  showToast('Saving changes...', 'info');

  try {
    const payload = collectPayload();
    const response = await fetch('/api/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Save failed (${response.status}).`);
    }

    currentData = payload;
    const now = new Date();
    showToast(`Saved successfully at ${now.toLocaleTimeString()}`, 'success');
  } catch (error) {
    showToast(error.message || 'Save failed.', 'error');
  }
}

function addRow() {
  const rows = readWeeklyRows();
  rows.push({ ...defaultWeeklyRow });
  renderWeeklyRows(rows);
}

function logout() {
  sessionToken = '';
  localStorage.removeItem(tokenKey);
  document.getElementById('editor-panel').classList.add('hidden');
  document.getElementById('login-panel').classList.remove('hidden');
  showToast('Logged out.', 'success');
}

async function bootstrap() {
  document.getElementById('login-form').addEventListener('submit', login);
  document.getElementById('editor-form').addEventListener('submit', saveChanges);
  document.getElementById('add-week-button').addEventListener('click', addRow);
  document.getElementById('logout-button').addEventListener('click', logout);

  const monthSelect = document.querySelector('[data-path="monthLabel"]');
  const monthCustom = document.querySelector('[data-path="monthLabelCustom"]');
  if (monthSelect && monthCustom) {
    monthSelect.addEventListener('change', () => {
      if (monthSelect.value === '__custom') {
        monthCustom.classList.remove('hidden');
        monthCustom.focus();
      } else {
        monthCustom.classList.add('hidden');
        monthCustom.value = '';
      }
      updateDashboardTitleDisplay();
    });
  }

  const monthStartInput = document.querySelector('[data-path="monthStart"]');
  if (monthStartInput) {
    monthStartInput.addEventListener('change', updateDashboardTitleDisplay);
  }
  if (monthCustom) {
    monthCustom.addEventListener('input', updateDashboardTitleDisplay);
  }

  const weekPicker = document.querySelector('[data-path="weekPicker"]');
  const weekDisplay = document.querySelector('[data-path="weekRangeDisplay"]');
  if (weekPicker && weekDisplay) {
    weekPicker.addEventListener('change', () => {
      weekDisplay.value = computeWeekRangeFromPicker(weekPicker.value) || '';
    });
  }

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

  if (!sessionToken) {
    return;
  }

  try {
    document.getElementById('login-panel').classList.add('hidden');
    document.getElementById('editor-panel').classList.remove('hidden');
    await loadDashboard();
  } catch (error) {
    sessionToken = '';
    localStorage.removeItem(tokenKey);
    document.getElementById('login-panel').classList.remove('hidden');
    document.getElementById('editor-panel').classList.add('hidden');
    showToast('Session expired. Please sign in again.', 'error');
  }
}

bootstrap();