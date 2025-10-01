// Dividend table application: parsing, state, rendering, sorting, pagination

/**
 * Columns expected for rendering.
 * @type {readonly string[]}
 */
const REQUIRED_COLUMNS = [
  "Ticker",
  "Ticker Name",
  "Number of Shares",
  "Payment Date",
  "Value"
];

/**
 * Inline fallback sample when local fetch is not available.
 * @type {string}
 */
const INLINE_SAMPLE_CSV = `Ticker,Ticker Name,Number of Shares,Payment Date,Value\nAAPL,Apple Inc,10,2025-08-15,5.40\nMSFT,Microsoft Corp,8,2025-08-20,4.16\nV,Visa Inc,5,2025-09-02,2.85\nKO,Coca-Cola Co,20,2025-09-10,3.40`;

/**
 * Global table state for sorting and pagination.
 */
const tableState = {
  rawRows: [],
  rows: [],
  sortKey: null,
  sortDir: "asc",
  page: 1,
  pageSize: 10,
};

// Aggregated by ticker table state
const summaryState = {
  rawRows: [],
  rows: [],
  sortKey: null,
  sortDir: "asc",
  page: 1,
  pageSize: 10,
};

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("file-input");
  input.addEventListener("change", onFileSelected);

  // Load sample CSV initially
  loadSampleCsv();

  // Pagination controls
  const pageSizeSelect = document.getElementById("page-size-select");
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener("change", () => {
      tableState.pageSize = Number(pageSizeSelect.value);
      tableState.page = 1;
      render();
    });
  }
  if (prevBtn) prevBtn.addEventListener("click", () => { changePage(-1); });
  if (nextBtn) nextBtn.addEventListener("click", () => { changePage(1); });

  // Summary table controls
  const sumPageSize = document.getElementById("summary-page-size-select");
  const sumPrev = document.getElementById("summary-prev-page");
  const sumNext = document.getElementById("summary-next-page");
  if (sumPageSize) {
    sumPageSize.addEventListener("change", () => {
      summaryState.pageSize = Number(sumPageSize.value);
      summaryState.page = 1;
      renderSummary();
    });
  }
  if (sumPrev) sumPrev.addEventListener("click", () => { changeSummaryPage(-1); });
  if (sumNext) sumNext.addEventListener("click", () => { changeSummaryPage(1); });

  // Initialize chart (Chart.js is deferred; guard availability)
  initChartIfReady();
});

/**
 * Handle file input selection and trigger CSV parsing.
 * @param {Event} event
 */
function onFileSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => parseCsvAndRender(reader.result);
  reader.onerror = () => alert("Failed to read the selected file.");
  reader.readAsText(file);
}

/**
 * Load a sample CSV from the project if available; otherwise use inline.
 */
async function loadSampleCsv() {
  try {
    const response = await fetch("./dividends.csv", { cache: "no-store" });
    if (!response.ok) throw new Error("Sample CSV not found");
    const text = await response.text();
    parseCsvAndRender(text);
  } catch (err) {
    parseCsvAndRender(INLINE_SAMPLE_CSV);
  }
}

/**
 * Parse CSV text with PapaParse, normalize keys, and render table state.
 * @param {string} csvText
 */
function parseCsvAndRender(csvText) {
  if (!window.Papa) {
    alert("CSV parser not loaded");
    return;
  }

  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => (h || "").trim(),
  });

  if (result.errors && result.errors.length > 0) {
    console.warn("CSV parse errors:", result.errors);
  }

  const rows = result.data || [];
  const normalizedRows = rows.map(normalizeRowKeys);
  tableState.rawRows = normalizedRows;
  tableState.page = 1;
  applySort();
  render();

  // Build and render summary table
  summaryState.rawRows = buildSummaryRows(normalizedRows);
  summaryState.page = 1;
  applySummarySort();
  renderSummary();
}

/**
 * Normalize a raw CSV row to the app's expected keys.
 * @param {Record<string, any>} row
 * @returns {Record<string, string|number>}
 */
function normalizeRowKeys(row) {
  const map = window.Utils.buildHeaderMap(Object.keys(row));
  // Prefer exact header 'Currency (Total)' if present in data
  const exactCurrencyTotalKey = Object.keys(row).find((k) => String(k).trim().toLowerCase() === 'currency (total)');
  const currencyRaw = exactCurrencyTotalKey ? row[exactCurrencyTotalKey] : (row[map.currency] ?? "");
  return {
    "Ticker": row[map.ticker] ?? "",
    "Ticker Name": row[map.name] ?? "",
    "Number of Shares": row[map.shares] ?? "",
    "Payment Date": window.Utils.formatDateDisplay(row[map.date] ?? ""),
    "Value": row[map.value] ?? "",
    "_Currency": currencyRaw,
  };
}

/**
 * Render a page of rows into the table body.
 * @param {Array<Record<string, any>>} rows
 */
function renderTable(rows) {
  const tbody = document.querySelector("#dividends-table tbody");
  tbody.innerHTML = "";

  if (!rows || rows.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = REQUIRED_COLUMNS.length;
    td.textContent = "No rows to display";
    td.style.color = "var(--muted)";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  for (const row of rows) {
    const tr = document.createElement("tr");
    for (const col of REQUIRED_COLUMNS) {
      const td = document.createElement("td");
      let value = row[col] ?? "";
      if (col === "Value" && typeof value === "string" && value !== "") {
        const num = window.Utils.numberFromMixedString(value);
        const symbol = window.Utils.currencySymbolFrom(row["_Currency"]);
        if (!Number.isNaN(num)) {
          const formatted = num.toFixed(2);
          value = symbol ? `${symbol} ${formatted}` : formatted;
        }
      }
      td.textContent = value;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

/**
 * Apply current sort order on raw rows to produce display rows.
 */
function applySort() {
  const { sortKey, sortDir } = tableState;
  const rows = [...tableState.rawRows];
  if (!sortKey) {
    tableState.rows = rows;
    return;
  }
  const dir = sortDir === "desc" ? -1 : 1;

  function toComparable(col, val) {
    if (col === "Payment Date") {
      const m = String(val).match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
      if (m) {
        const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5]));
        return d.getTime();
      }
    }
    if (col === "Number of Shares" || col === "Value") {
      const num = window.Utils.numberFromMixedString(val);
      if (!Number.isNaN(num)) return num;
    }
    const s = String(val || "").toLowerCase();
    return s;
  }

  rows.sort((a, b) => {
    const av = toComparable(sortKey, a[sortKey]);
    const bv = toComparable(sortKey, b[sortKey]);
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
  tableState.rows = rows;
}

/**
 * Attach and update sort header interactions and indicators.
 */
function renderHeaderInteractions() {
  const ths = document.querySelectorAll('#dividends-table thead th.sortable');
  ths.forEach((th) => {
    th.removeEventListener("click", th._sortHandler || (() => {}));
    const handler = () => {
      const key = th.getAttribute('data-key');
      if (!key) return;
      if (tableState.sortKey === key) {
        tableState.sortDir = tableState.sortDir === "asc" ? "desc" : "asc";
      } else {
        tableState.sortKey = key;
        tableState.sortDir = "asc";
      }
      tableState.page = 1;
      applySort();
      render();
    };
    th._sortHandler = handler;
    th.addEventListener("click", handler);

    let indicator = th.querySelector('.sort-indicator');
    if (!indicator) {
      const span = document.createElement('span');
      span.className = 'sort-indicator';
      th.appendChild(span);
    }
  });
  ths.forEach((th) => {
    const span = th.querySelector('.sort-indicator');
    if (!span) return;
    const key = th.getAttribute('data-key');
    if (tableState.sortKey === key) {
      span.textContent = tableState.sortDir === 'asc' ? '▲' : '▼';
    } else {
      span.textContent = '';
    }
  });
}

/**
 * Change the current page by a delta (-1 or +1 typically) and re-render.
 * @param {number} delta
 */
function changePage(delta) {
  const total = tableState.rows.length;
  const lastPage = Math.max(1, Math.ceil(total / tableState.pageSize));
  const next = Math.min(lastPage, Math.max(1, tableState.page + delta));
  if (next !== tableState.page) {
    tableState.page = next;
    render();
  }
}

/**
 * Render pagination bar state (range and button enablement).
 */
function renderPagination() {
  const total = tableState.rows.length;
  const lastPage = Math.max(1, Math.ceil(total / tableState.pageSize));
  const start = total === 0 ? 0 : (tableState.page - 1) * tableState.pageSize + 1;
  const end = Math.min(total, tableState.page * tableState.pageSize);

  const info = document.getElementById('page-info');
  const prev = document.getElementById('prev-page');
  const next = document.getElementById('next-page');
  if (info) info.textContent = `${start}-${end} of ${total}`;
  if (prev) prev.disabled = tableState.page <= 1;
  if (next) next.disabled = tableState.page >= lastPage;
}

/**
 * Render function driving the table body, header indicators, and pagination.
 */
function render() {
  const total = tableState.rows.length;
  const startIdx = (tableState.page - 1) * tableState.pageSize;
  const endIdx = Math.min(total, startIdx + tableState.pageSize);
  const pageRows = tableState.rows.slice(startIdx, endIdx);

  renderTable(pageRows);
  renderHeaderInteractions();
  renderPagination();
  renderOverview();
  updateChart();
}

// ===== Summary table (by ticker) =====

/**
 * Build aggregated rows per ticker with totals and averages.
 * @param {Array<Record<string, any>>} rows
 * @returns {Array<Record<string, any>>}
 */
function buildSummaryRows(rows) {
  const map = new Map();
  for (const r of rows) {
    const ticker = r['Ticker'] || '';
    const name = r['Ticker Name'] || '';
    const num = window.Utils.numberFromMixedString(r['Value']);
    if (Number.isNaN(num)) continue;
    if (!map.has(ticker)) {
      map.set(ticker, { ticker, name, count: 0, total: 0 });
    }
    const ref = map.get(ticker);
    ref.count += 1;
    ref.total += num;
  }
  const currency = rows.find((r) => r['_Currency'])?._Currency || '';
  const symbol = window.Utils.currencySymbolFrom(currency);
  const fmt = (n) => `${symbol ? symbol + ' ' : ''}${n.toFixed(2)}`;
  const out = [];
  for (const { ticker, name, count, total } of map.values()) {
    const avg = count > 0 ? total / count : 0;
    out.push({
      'Ticker': ticker,
      'Ticker Name': name,
      'Number of Payments': count,
      'Total Payments': fmt(total),
      'Average Payment': fmt(avg),
    });
  }
  return out;
}

function applySummarySort() {
  const { sortKey, sortDir } = summaryState;
  const rows = [...summaryState.rawRows];
  if (!sortKey) { summaryState.rows = rows; return; }
  const dir = sortDir === 'desc' ? -1 : 1;

  function toComparable(col, val) {
    if (col === 'Number of Payments') {
      const n = Number(val);
      return Number.isNaN(n) ? -Infinity : n;
    }
    if (col === 'Total Payments' || col === 'Average Payment') {
      return window.Utils.numberFromMixedString(val);
    }
    return String(val || '').toLowerCase();
  }

  rows.sort((a, b) => {
    const av = toComparable(sortKey, a[sortKey]);
    const bv = toComparable(sortKey, b[sortKey]);
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
  summaryState.rows = rows;
}

function renderSummaryHeaderInteractions() {
  const ths = document.querySelectorAll('#summary-table thead th.sortable');
  ths.forEach((th) => {
    th.removeEventListener('click', th._sortHandler || (() => {}));
    const handler = () => {
      const key = th.getAttribute('data-key');
      if (!key) return;
      if (summaryState.sortKey === key) {
        summaryState.sortDir = summaryState.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        summaryState.sortKey = key;
        summaryState.sortDir = 'asc';
      }
      summaryState.page = 1;
      applySummarySort();
      renderSummary();
    };
    th._sortHandler = handler;
    th.addEventListener('click', handler);

    let indicator = th.querySelector('.sort-indicator');
    if (!indicator) {
      const span = document.createElement('span');
      span.className = 'sort-indicator';
      th.appendChild(span);
    }
  });
  ths.forEach((th) => {
    const span = th.querySelector('.sort-indicator');
    if (!span) return;
    const key = th.getAttribute('data-key');
    if (summaryState.sortKey === key) {
      span.textContent = summaryState.sortDir === 'asc' ? '▲' : '▼';
    } else {
      span.textContent = '';
    }
  });
}

function changeSummaryPage(delta) {
  const total = summaryState.rows.length;
  const lastPage = Math.max(1, Math.ceil(total / summaryState.pageSize));
  const next = Math.min(lastPage, Math.max(1, summaryState.page + delta));
  if (next !== summaryState.page) {
    summaryState.page = next;
    renderSummary();
  }
}

function renderSummaryPagination() {
  const total = summaryState.rows.length;
  const lastPage = Math.max(1, Math.ceil(total / summaryState.pageSize));
  const start = total === 0 ? 0 : (summaryState.page - 1) * summaryState.pageSize + 1;
  const end = Math.min(total, summaryState.page * summaryState.pageSize);
  const info = document.getElementById('summary-page-info');
  const prev = document.getElementById('summary-prev-page');
  const next = document.getElementById('summary-next-page');
  if (info) info.textContent = `${start}-${end} of ${total}`;
  if (prev) prev.disabled = summaryState.page <= 1;
  if (next) next.disabled = summaryState.page >= lastPage;
}

function renderSummaryTable(rows) {
  const tbody = document.querySelector('#summary-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!rows || rows.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.textContent = 'No rows to display';
    td.style.color = 'var(--muted)';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  for (const row of rows) {
    const tr = document.createElement('tr');
    for (const key of ['Ticker', 'Ticker Name', 'Number of Payments', 'Average Payment', 'Total Payments']) {
      const td = document.createElement('td');
      const val = row[key] ?? '';
      if (key === 'Total Payments') {
        td.textContent = val;
        td.classList.add('value-positive');
      } else {
        td.textContent = val;
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

function renderSummary() {
  const total = summaryState.rows.length;
  const startIdx = (summaryState.page - 1) * summaryState.pageSize;
  const endIdx = Math.min(total, startIdx + summaryState.pageSize);
  const pageRows = summaryState.rows.slice(startIdx, endIdx);
  renderSummaryTable(pageRows);
  renderSummaryHeaderInteractions();
  renderSummaryPagination();
}

/**
 * Compute and render Payments Overview metrics using all rows (not paginated slice).
 */
function renderOverview() {
  const rows = tableState.rows; // already sorted if requested
  if (!rows || rows.length === 0) {
    setOverviewText('ov-first', '—');
    setOverviewText('ov-last', '—');
    setOverviewText('ov-count', '0');
    setOverviewText('ov-total', '—');
    setOverviewText('ov-avg', '—');
    setOverviewText('ov-max', '—');
    return;
  }

  // Parse dates back to timestamps for first/last
  function parseDisplayDate(s) {
    const m = String(s).match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
    if (!m) return NaN;
    return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5])).getTime();
  }

  const timestamps = rows
    .map((r) => ({ t: parseDisplayDate(r['Payment Date']), row: r }))
    .filter((x) => Number.isFinite(x.t))
    .sort((a, b) => a.t - b.t);

  const first = timestamps[0];
  const last = timestamps[timestamps.length - 1];

  // Totals
  let totalAmount = 0;
  let count = 0;
  let maxPayment = { amount: -Infinity, row: null };
  for (const r of rows) {
    const num = window.Utils.numberFromMixedString(r['Value']);
    if (Number.isNaN(num)) continue;
    count += 1;
    totalAmount += num;
    if (num > maxPayment.amount) maxPayment = { amount: num, row: r };
  }
  const avg = count > 0 ? totalAmount / count : 0;

  // Currency symbol: prefer first row's currency (assumes consistent file currency)
  const currency = rows.find((r) => r['_Currency'])?._Currency || '';
  const symbol = window.Utils.currencySymbolFrom(currency);
  const money = (n) => `${symbol ? symbol + ' ' : ''}${n.toFixed(2)}`;

  setOverviewText('ov-first', first ? first.row['Payment Date'] : '—');
  setOverviewText('ov-last', last ? last.row['Payment Date'] : '—');
  setOverviewText('ov-count', String(count));
  const totalEl = document.getElementById('ov-total');
  if (totalEl) {
    totalEl.textContent = count > 0 ? money(totalAmount) : '—';
    totalEl.classList.toggle('value-positive', count > 0);
  }
  setOverviewText('ov-avg', count > 0 ? money(avg) : '—');
  if (maxPayment.row) {
    const ticker = maxPayment.row['Ticker'] || '';
    const name = maxPayment.row['Ticker Name'] || '';
    const when = maxPayment.row['Payment Date'] || '';
    const maxEl = document.getElementById('ov-max');
    if (maxEl) {
      maxEl.innerHTML = '';
      const wrapper = document.createElement('div');
      wrapper.className = 'value-multiline';
      const v1 = document.createElement('div');
      v1.textContent = money(maxPayment.amount);
      const v2 = document.createElement('div');
      v2.textContent = ticker;
      const v3 = document.createElement('div');
      v3.className = 'sub';
      v3.textContent = name;
      const v4 = document.createElement('div');
      v4.textContent = when;
      wrapper.appendChild(v1);
      wrapper.appendChild(v2);
      wrapper.appendChild(v3);
      wrapper.appendChild(v4);
      maxEl.appendChild(wrapper);
    }
  } else {
    setOverviewText('ov-max', '—');
  }
}

/**
 * Helper to set overview text content safely.
 * @param {string} id
 * @param {string} text
 */
function setOverviewText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ===== Payments per month chart =====
let paymentsChart = null;

function initChartIfReady() {
  if (!window.Chart) return;
  // Register datalabels plugin if present (needed for labels to show)
  if (window.ChartDataLabels) {
    try { window.Chart.register(window.ChartDataLabels); } catch (_) {}
  }
  const ctx = document.getElementById('payments-chart');
  if (!ctx) return;
  if (paymentsChart) return;
  paymentsChart = new window.Chart(ctx, {
    type: 'bar',
    data: { labels: [], datasets: [{ label: 'Payments', data: [], backgroundColor: 'rgba(79, 140, 255, 0.6)' }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { callback: (v) => v } },
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      },
    },
  });
}

function updateChart() {
  initChartIfReady();
  if (!paymentsChart) return;
  const rows = tableState.rows;
  if (!rows || rows.length === 0) {
    paymentsChart.data.labels = [];
    paymentsChart.data.datasets[0].data = [];
    paymentsChart.update();
    return;
  }

  // Determine currency for y formatting
  const currency = rows.find((r) => r['_Currency'])?._Currency || '';
  const symbol = window.Utils.currencySymbolFrom(currency);

  // Build month buckets from first payment month to current month
  function parseDisplayDate(s) {
    const m = String(s).match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
    if (!m) return NaN;
    return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5])).getTime();
  }
  const timestamps = rows
    .map((r) => parseDisplayDate(r['Payment Date']))
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b);
  if (timestamps.length === 0) return;

  const first = new Date(timestamps[0]);
  const today = new Date();
  const labels = [];
  const keyToIndex = new Map();
  const sums = [];

  function keyFor(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
  function labelFor(d) {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${yyyy}`;
  }

  // Iterate months from first to today (inclusive)
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth(), 1);
  while (cursor <= end) {
    const key = keyFor(cursor);
    keyToIndex.set(key, labels.length);
    labels.push(labelFor(cursor));
    sums.push(0);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // Sum values into month buckets
  for (const r of rows) {
    const t = parseDisplayDate(r['Payment Date']);
    if (!Number.isFinite(t)) continue;
    const d = new Date(t);
    const key = keyFor(d);
    const idx = keyToIndex.get(key);
    if (idx == null) continue;
    const amt = window.Utils.numberFromMixedString(r['Value']);
    if (Number.isNaN(amt)) continue;
    sums[idx] += amt;
  }

  paymentsChart.data.labels = labels;
  paymentsChart.data.datasets[0].data = sums.map((n) => Number(n.toFixed(2)));
  paymentsChart.options.scales.y.ticks.callback = (v) => `${symbol ? symbol + ' ' : ''}${Number(v).toFixed(0)}`;
  // Add bold green value labels on top of bars
  // Only set datalabels if plugin is available
  if (window.ChartDataLabels) {
    paymentsChart.options.plugins.datalabels = {
      color: '#22c55e',
      anchor: 'end',
      align: 'end',
      formatter: (v) => `${symbol ? symbol + ' ' : ''}${Number(v).toFixed(2)}`,
      font: { weight: '700' }
    };
  }
  paymentsChart.update();
}


