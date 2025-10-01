// Sorting functionality for tables

/**
 * Apply current sort order on raw rows to produce display rows for main table.
 */
function applySort() {
  const { sortKey, sortDir } = window.State.tableState;
  const rows = [...window.State.tableState.rawRows];
  if (!sortKey) {
    window.State.tableState.rows = rows;
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
  window.State.tableState.rows = rows;
}

/**
 * Apply current sort order on raw rows to produce display rows for summary table.
 */
function applySummarySort() {
  const { sortKey, sortDir } = window.State.summaryState;
  const rows = [...window.State.summaryState.rawRows];
  if (!sortKey) { 
    window.State.summaryState.rows = rows; 
    return; 
  }
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
  window.State.summaryState.rows = rows;
}

// Export functions to global scope
window.Sorting = {
  applySort,
  applySummarySort
};
