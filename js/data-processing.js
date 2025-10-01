// CSV parsing and data processing functionality

/**
 * Parse CSV text with PapaParse, normalize keys, and render table state.
 * @param {string} csvText - Raw CSV content to parse
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
  
  // Update main table state
  window.State.tableState.rawRows = normalizedRows;
  window.State.tableState.page = 1;
  window.Sorting.applySort();
  window.Rendering.render();

  // Update summary table state
  window.State.summaryState.rawRows = buildSummaryRows(normalizedRows);
  window.State.summaryState.page = 1;
  window.Sorting.applySummarySort();
  window.Rendering.renderSummary();

  // Update charts
  window.Charts.updateChart();
  window.Charts.updateGrowthChart();
}

/**
 * Normalize a raw CSV row to the app's expected keys.
 * @param {Record<string, any>} row - Raw CSV row object
 * @returns {Record<string, string|number>} Normalized row with consistent keys
 */
function normalizeRowKeys(row) {
  const map = window.Utils.buildHeaderMap(Object.keys(row));
  // Prefer exact header 'Currency (Total)' if present in data
  const exactCurrencyTotalKey = Object.keys(row).find((k) => 
    String(k).trim().toLowerCase() === 'currency (total)'
  );
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
 * Build aggregated rows per ticker with totals and averages.
 * @param {Array<Record<string, any>>} rows - Normalized dividend rows
 * @returns {Array<Record<string, any>>} Aggregated summary rows by ticker
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

/**
 * Load sample CSV data for demonstration purposes.
 */
async function loadSampleCsv() {
  try {
    parseCsvAndRender(window.Constants.INLINE_SAMPLE_CSV);
  } catch (err) {
    console.error("Failed to load sample CSV:", err);
  }
}

// Export functions to global scope
window.DataProcessing = {
  parseCsvAndRender,
  normalizeRowKeys,
  buildSummaryRows,
  loadSampleCsv
};
