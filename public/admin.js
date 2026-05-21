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

function setMessage(element, message, isError = false) {
  element.textContent = message;
  element.className = isError ? 'mt-3 font-semibold text-[#d21f1f]' : 'mt-3 font-semibold text-slate-500';
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
        <tr class="odd:bg-slate-50">
          <td class="border border-slate-300 p-2"><input data-row="${index}" data-field="week" value="${row.week ?? ''}" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-sans outline-none focus:border-[#1f5fb8] focus:ring-2 focus:ring-[#1f5fb8]/20" /></td>
          <td class="border border-slate-300 p-2"><input data-row="${index}" data-field="start" value="${row.start ?? ''}" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-sans outline-none focus:border-[#1f5fb8] focus:ring-2 focus:ring-[#1f5fb8]/20" /></td>
          <td class="border border-slate-300 p-2"><input data-row="${index}" data-field="end" value="${row.end ?? ''}" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-sans outline-none focus:border-[#1f5fb8] focus:ring-2 focus:ring-[#1f5fb8]/20" /></td>
          <td class="border border-slate-300 p-2"><input data-row="${index}" data-field="target" type="number" step="0.01" value="${row.target ?? ''}" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-sans outline-none focus:border-[#1f5fb8] focus:ring-2 focus:ring-[#1f5fb8]/20" /></td>
          <td class="border border-slate-300 p-2"><input data-row="${index}" data-field="invoiced" type="number" step="0.01" value="${row.invoiced ?? ''}" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-sans outline-none focus:border-[#1f5fb8] focus:ring-2 focus:ring-[#1f5fb8]/20" /></td>
          <td class="border border-slate-300 p-2"><input data-row="${index}" data-field="percent" type="number" step="1" value="${row.percent ?? ''}" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-sans outline-none focus:border-[#1f5fb8] focus:ring-2 focus:ring-[#1f5fb8]/20" /></td>
          <td class="border border-slate-300 p-2"><button type="button" class="rounded-xl bg-[#ffe5e5] px-3 py-2 font-bold text-[#d21f1f]" data-remove-row="${index}">Remove</button></td>
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

function populateForm(data) {
  requireData();

  document.querySelector('[data-path="dashboardTitle"]').value = data.dashboardTitle ?? '';
  // monthRange is now two date inputs (monthStart / monthEnd). Try to parse existing monthRange.
  const startInput = document.querySelector('[data-path="monthStart"]');
  const endInput = document.querySelector('[data-path="monthEnd"]');
  const parseToISO = (text) => {
    if (!text) return '';
    // split by dash if the stored format is like "May 1, 2026 - May 31, 2026"
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
    // end may be stored as second part of monthRange or as monthEnd
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
  // weekRange is now selected via a week picker (`type="week"`). Populate it if we can infer a week.
  const weekPicker = document.querySelector('[data-path="weekPicker"]');
  if (weekPicker) {
    // try to infer from data.weekRange (e.g., "May 17, 2026 - May 23, 2026")
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
    // update dashboard title display based on month label or monthStart
    const dashboardDisplay = document.getElementById('dashboardTitleDisplay');
    const hiddenTitle = document.querySelector('[data-path="dashboardTitle"]');
    const computeMonthName = () => {
      const sel = document.querySelector('[data-path="monthLabel"]');
      const custom = document.querySelector('[data-path="monthLabelCustom"]');
      if (sel && sel.value === '__custom' && custom && custom.value.trim()) return custom.value.trim();
      if (sel && sel.value) return sel.value;
      const s = startInput?.value;
      if (s) {
        const d = new Date(s);
        if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
      return '';
    };
    const monthName = computeMonthName();
    const titleText = monthName ? `Target for the month of ${monthName}` : 'Target for the month of —';
    if (dashboardDisplay) dashboardDisplay.textContent = titleText;
    if (hiddenTitle) hiddenTitle.value = titleText;
}

function collectPayload() {
  const payload = {
    // dashboardTitle is auto-generated
    dashboardTitle: document.querySelector('[data-path="dashboardTitle"]')?.value.trim() || '',
    monthRange: (function(){
      const s = document.querySelector('[data-path="monthStart"]')?.value || '';
      const e = document.querySelector('[data-path="monthEnd"]')?.value || '';
      if (!s && !e) return '';
      const parseAndFormat = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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
        const mon = new Date(Date.UTC(yr, 0, 4 - (dayOfWeek - 1) + (wk - 1) * 7));
        return mon;
      }
      const start = getDateOfISOWeek(week, year);
      const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6));
      const format = (d) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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
      const mon = new Date(Date.UTC(yr, 0, 4 - (dayOfWeek - 1) + (wk - 1) * 7));
      return mon;
    }
    const start = getDateOfISOWeek(week, year);
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6));
    const format = (d) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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

  const loginStatus = document.getElementById('login-status');
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  setMessage(loginStatus, 'Signing in...');

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
    setMessage(loginStatus, '');
    await loadDashboard();
  } catch (error) {
    setMessage(loginStatus, error.message || 'Login failed.', true);
  }
}

async function saveChanges(event) {
  event.preventDefault();

  const saveStatus = document.getElementById('save-status');
  setMessage(saveStatus, 'Saving changes...');

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
    setMessage(saveStatus, `Saved — ${now.toLocaleString()}`);
  } catch (error) {
    setMessage(saveStatus, error.message || 'Save failed.', true);
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
  setMessage(document.getElementById('login-status'), 'Logged out.');
}

async function bootstrap() {
  document.getElementById('login-form').addEventListener('submit', login);
  document.getElementById('editor-form').addEventListener('submit', saveChanges);
  document.getElementById('add-week-button').addEventListener('click', addRow);
  document.getElementById('logout-button').addEventListener('click', logout);

  // Toggle custom month input when user selects 'Custom…'
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
    });
  }

  // Update week range display when the week picker changes
  const weekPicker = document.querySelector('[data-path="weekPicker"]');
  const weekDisplay = document.querySelector('[data-path="weekRangeDisplay"]');
  if (weekPicker && weekDisplay) {
    weekPicker.addEventListener('change', () => {
      weekDisplay.value = computeWeekRangeFromPicker(weekPicker.value) || '';
    });
  }

  // Keyboard shortcut: Ctrl/Cmd+S to save the form
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
    setMessage(document.getElementById('login-status'), 'Session expired. Please sign in again.', true);
  }
}

bootstrap();