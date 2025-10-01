// Pagination functionality for tables

/**
 * Change the current page by a delta (-1 or +1 typically) and re-render main table.
 * @param {number} delta - Page change amount
 */
function changePage(delta) {
  const total = window.State.tableState.rows.length;
  const lastPage = Math.max(1, Math.ceil(total / window.State.tableState.pageSize));
  const next = Math.min(lastPage, Math.max(1, window.State.tableState.page + delta));
  if (next !== window.State.tableState.page) {
    window.State.tableState.page = next;
    window.Rendering.render();
  }
}

/**
 * Change the current page by a delta for summary table.
 * @param {number} delta - Page change amount
 */
function changeSummaryPage(delta) {
  const total = window.State.summaryState.rows.length;
  const lastPage = Math.max(1, Math.ceil(total / window.State.summaryState.pageSize));
  const next = Math.min(lastPage, Math.max(1, window.State.summaryState.page + delta));
  if (next !== window.State.summaryState.page) {
    window.State.summaryState.page = next;
    window.Rendering.renderSummary();
  }
}

/**
 * Render pagination bar state (range and button enablement) for main table.
 */
function renderPagination() {
  const total = window.State.tableState.rows.length;
  const lastPage = Math.max(1, Math.ceil(total / window.State.tableState.pageSize));
  const start = total === 0 ? 0 : (window.State.tableState.page - 1) * window.State.tableState.pageSize + 1;
  const end = Math.min(total, window.State.tableState.page * window.State.tableState.pageSize);

  const info = document.getElementById('page-info');
  const prev = document.getElementById('prev-page');
  const next = document.getElementById('next-page');
  if (info) info.textContent = `${start}-${end} of ${total}`;
  if (prev) prev.disabled = window.State.tableState.page <= 1;
  if (next) next.disabled = window.State.tableState.page >= lastPage;
}

/**
 * Render pagination bar state for summary table.
 */
function renderSummaryPagination() {
  const total = window.State.summaryState.rows.length;
  const lastPage = Math.max(1, Math.ceil(total / window.State.summaryState.pageSize));
  const start = total === 0 ? 0 : (window.State.summaryState.page - 1) * window.State.summaryState.pageSize + 1;
  const end = Math.min(total, window.State.summaryState.page * window.State.summaryState.pageSize);
  const info = document.getElementById('summary-page-info');
  const prev = document.getElementById('summary-prev-page');
  const next = document.getElementById('summary-next-page');
  if (info) info.textContent = `${start}-${end} of ${total}`;
  if (prev) prev.disabled = window.State.summaryState.page <= 1;
  if (next) next.disabled = window.State.summaryState.page >= lastPage;
}

// Export functions to global scope
window.Pagination = {
  changePage,
  changeSummaryPage,
  renderPagination,
  renderSummaryPagination
};
