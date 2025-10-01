// Main application initialization and event handling

/**
 * Handle file input selection and trigger CSV parsing.
 * @param {Event} event - File input change event
 */
function onFileSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => window.DataProcessing.parseCsvAndRender(reader.result);
  reader.onerror = () => alert("Failed to read the selected file.");
  reader.readAsText(file);
}

/**
 * Initialize the application when DOM is loaded.
 */
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("file-input");
  input.addEventListener("change", onFileSelected);

  // Load sample CSV initially
  window.DataProcessing.loadSampleCsv();

  // Pagination controls for main table
  const pageSizeSelect = document.getElementById("page-size-select");
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener("change", () => {
      window.State.tableState.pageSize = Number(pageSizeSelect.value);
      window.State.tableState.page = 1;
      window.Rendering.render();
    });
  }
  if (prevBtn) prevBtn.addEventListener("click", () => { window.Pagination.changePage(-1); });
  if (nextBtn) nextBtn.addEventListener("click", () => { window.Pagination.changePage(1); });

  // Pagination controls for summary table
  const sumPageSize = document.getElementById("summary-page-size-select");
  const sumPrev = document.getElementById("summary-prev-page");
  const sumNext = document.getElementById("summary-next-page");
  if (sumPageSize) {
    sumPageSize.addEventListener("change", () => {
      window.State.summaryState.pageSize = Number(sumPageSize.value);
      window.State.summaryState.page = 1;
      window.Rendering.renderSummary();
    });
  }
  if (sumPrev) sumPrev.addEventListener("click", () => { window.Pagination.changeSummaryPage(-1); });
  if (sumNext) sumNext.addEventListener("click", () => { window.Pagination.changeSummaryPage(1); });

  // Initialize charts (Chart.js is deferred; guard availability)
  window.Charts.initChartIfReady();
  window.Charts.initGrowthChartIfReady();
});
