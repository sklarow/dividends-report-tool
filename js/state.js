// State management for the dividend tracker application

/**
 * Global table state for sorting and pagination of main dividend transactions.
 */
const tableState = {
  rawRows: [],
  rows: [],
  sortKey: "Payment Date",
  sortDir: "desc",
  page: 1,
  pageSize: 10,
};

/**
 * State for aggregated summary table (by ticker).
 */
const summaryState = {
  rawRows: [],
  rows: [],
  sortKey: "Total Payments", 
  sortDir: "desc",
  page: 1,
  pageSize: 10,
};

/**
 * Chart instances for payments and growth visualization.
 */
const chartInstances = {
  paymentsChart: null,
  growthChart: null
};

// Export state objects to global scope
window.State = {
  tableState,
  summaryState,
  chartInstances
};
