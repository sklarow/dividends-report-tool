// Table rendering functionality

/**
 * Render a page of rows into the main table body.
 * @param {Array<Record<string, any>>} rows - Rows to render
 */
function renderTable(rows) {
  const tbody = document.querySelector("#dividends-table tbody");
  tbody.innerHTML = "";

  if (!rows || rows.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = window.Constants.REQUIRED_COLUMNS.length;
    td.textContent = "No rows to display";
    td.style.color = "var(--muted)";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  for (const row of rows) {
    const tr = document.createElement("tr");
    for (const col of window.Constants.REQUIRED_COLUMNS) {
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
 * Render summary table rows.
 * @param {Array<Record<string, any>>} rows - Summary rows to render
 */
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

/**
 * Attach and update sort header interactions and indicators for main table.
 */
function renderHeaderInteractions() {
  const ths = document.querySelectorAll('#dividends-table thead th.sortable');
  ths.forEach((th) => {
    th.removeEventListener("click", th._sortHandler || (() => {}));
    const handler = () => {
      const key = th.getAttribute('data-key');
      if (!key) return;
      if (window.State.tableState.sortKey === key) {
        window.State.tableState.sortDir = window.State.tableState.sortDir === "asc" ? "desc" : "asc";
      } else {
        window.State.tableState.sortKey = key;
        window.State.tableState.sortDir = "asc";
      }
      window.State.tableState.page = 1;
      window.Sorting.applySort();
      window.Rendering.render();
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
    if (window.State.tableState.sortKey === key) {
      span.textContent = window.State.tableState.sortDir === 'asc' ? '▲' : '▼';
    } else {
      span.textContent = '';
    }
  });
}

/**
 * Attach and update sort header interactions and indicators for summary table.
 */
function renderSummaryHeaderInteractions() {
  const ths = document.querySelectorAll('#summary-table thead th.sortable');
  ths.forEach((th) => {
    th.removeEventListener('click', th._sortHandler || (() => {}));
    const handler = () => {
      const key = th.getAttribute('data-key');
      if (!key) return;
      if (window.State.summaryState.sortKey === key) {
        window.State.summaryState.sortDir = window.State.summaryState.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        window.State.summaryState.sortKey = key;
        window.State.summaryState.sortDir = 'asc';
      }
      window.State.summaryState.page = 1;
      window.Sorting.applySummarySort();
      window.Rendering.renderSummary();
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
    if (window.State.summaryState.sortKey === key) {
      span.textContent = window.State.summaryState.sortDir === 'asc' ? '▲' : '▼';
    } else {
      span.textContent = '';
    }
  });
}

/**
 * Main render function driving the table body, header indicators, and pagination.
 */
function render() {
  const total = window.State.tableState.rows.length;
  const startIdx = (window.State.tableState.page - 1) * window.State.tableState.pageSize;
  const endIdx = Math.min(total, startIdx + window.State.tableState.pageSize);
  const pageRows = window.State.tableState.rows.slice(startIdx, endIdx);

  renderTable(pageRows);
  renderHeaderInteractions();
  window.Pagination.renderPagination();
  window.Overview.renderOverview();
  window.Charts.updateChart();
  window.Charts.updateGrowthChart();
}

/**
 * Summary table render function.
 */
function renderSummary() {
  const total = window.State.summaryState.rows.length;
  const startIdx = (window.State.summaryState.page - 1) * window.State.summaryState.pageSize;
  const endIdx = Math.min(total, startIdx + window.State.summaryState.pageSize);
  const pageRows = window.State.summaryState.rows.slice(startIdx, endIdx);
  renderSummaryTable(pageRows);
  renderSummaryHeaderInteractions();
  window.Pagination.renderSummaryPagination();
}

// Export functions to global scope
window.Rendering = {
  renderTable,
  renderSummaryTable,
  renderHeaderInteractions,
  renderSummaryHeaderInteractions,
  render,
  renderSummary
};
