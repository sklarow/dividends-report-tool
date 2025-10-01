// Chart functionality for payments and growth visualization

/**
 * Initialize payments chart if Chart.js is available.
 */
function initChartIfReady() {
  if (!window.Chart) return;
  // Register datalabels plugin if present (needed for labels to show)
  if (window.ChartDataLabels) {
    try { window.Chart.register(window.ChartDataLabels); } catch (_) {}
  }
  const ctx = document.getElementById('payments-chart');
  if (!ctx) return;
  if (window.State.chartInstances.paymentsChart) return;
  
  window.State.chartInstances.paymentsChart = new window.Chart(ctx, {
    type: 'bar',
    data: { 
      labels: [], 
      datasets: [{ 
        label: 'Payments', 
        data: [], 
        backgroundColor: 'rgba(79, 140, 255, 0.6)' 
      }] 
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 12, right: 8, bottom: 8, left: 8 } },
      scales: {
        x: { grid: { display: false } },
        y: { 
          beginAtZero: true, 
          grid: { color: 'rgba(255,255,255,0.06)' }, 
          ticks: { callback: (v) => v } 
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      },
    },
  });
}

/**
 * Initialize growth chart if Chart.js is available.
 */
function initGrowthChartIfReady() {
  if (!window.Chart) return;
  const ctx = document.getElementById('growth-chart');
  if (!ctx) return;
  if (window.State.chartInstances.growthChart) return;
  
  window.State.chartInstances.growthChart = new window.Chart(ctx, {
    type: 'line',
    data: { 
      labels: [], 
      datasets: [{ 
        label: 'Cumulative', 
        data: [], 
        borderColor: 'rgba(147,51,234,0.9)', 
        backgroundColor: 'rgba(147,51,234,0.15)', 
        fill: true, 
        tension: 0.25,
        pointBackgroundColor: 'rgba(147,51,234,0.9)',
        pointBorderColor: 'rgba(147,51,234,0.9)',
        pointRadius: 4,
        pointHoverRadius: 6
      }] 
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 10, right: 8, bottom: 8, left: 8 } },
      scales: {
        x: { grid: { display: false } },
        y: { 
          beginAtZero: true, 
          grid: { color: 'rgba(255,255,255,0.06)' },
          suggestedMax: 0 // Will be updated dynamically
        },
      },
      plugins: { 
        legend: { display: false },
        datalabels: {
          color: '#22c55e',
          anchor: 'end',
          align: 'end',
          formatter: (v) => `€${Number(v).toFixed(2)}`,
          font: { weight: '700' }
        }
      },
    },
  });
}

/**
 * Update payments chart with last 12 months data.
 */
function updateChart() {
  initChartIfReady();
  if (!window.State.chartInstances.paymentsChart) return;
  const rows = window.State.tableState.rows;
  if (!rows || rows.length === 0) {
    window.State.chartInstances.paymentsChart.data.labels = [];
    window.State.chartInstances.paymentsChart.data.datasets[0].data = [];
    window.State.chartInstances.paymentsChart.update();
    return;
  }

  // Determine currency for y formatting
  const currency = rows.find((r) => r['_Currency'])?._Currency || '';
  const symbol = window.Utils.currencySymbolFrom(currency);

  // Build month buckets for last 12 months ending current month
  function parseDisplayDate(s) {
    const m = String(s).match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
    if (!m) return NaN;
    return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5])).getTime();
  }
  
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

  // Iterate months from 11 months ago to current month (inclusive)
  const start = new Date(today.getFullYear(), today.getMonth() - 11, 1);
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
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

  window.State.chartInstances.paymentsChart.data.labels = labels;
  window.State.chartInstances.paymentsChart.data.datasets[0].data = sums.map((n) => Number(n.toFixed(2)));
  window.State.chartInstances.paymentsChart.options.scales.y.ticks.callback = (v) => `${symbol ? symbol + ' ' : ''}${Number(v).toFixed(0)}`;
  
  // Ensure Y axis has headroom so top labels are not cropped
  const maxSum = Math.max(...sums);
  window.State.chartInstances.paymentsChart.options.scales.y.suggestedMax = Number((maxSum * 1.15).toFixed(2));
  
  // Add bold green value labels on top of bars
  if (window.ChartDataLabels) {
    window.State.chartInstances.paymentsChart.options.plugins.datalabels = {
      color: '#22c55e',
      anchor: 'end',
      align: 'end',
      formatter: (v) => `${symbol ? symbol + ' ' : ''}${Number(v).toFixed(2)}`,
      font: { weight: '700' }
    };
  }
  window.State.chartInstances.paymentsChart.update();
}

/**
 * Update growth chart with cumulative dividend data.
 */
function updateGrowthChart() {
  initGrowthChartIfReady();
  if (!window.State.chartInstances.growthChart) return;
  const rows = window.State.tableState.rows;
  if (!rows || rows.length === 0) {
    window.State.chartInstances.growthChart.data.labels = [];
    window.State.chartInstances.growthChart.data.datasets[0].data = [];
    window.State.chartInstances.growthChart.update();
    return;
  }

  const currency = rows.find((r) => r['_Currency'])?._Currency || '';
  const symbol = window.Utils.currencySymbolFrom(currency);

  function parseDisplayDate(s) {
    const m = String(s).match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
    if (!m) return NaN;
    return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5])).getTime();
  }

  // Build month buckets from first payment month to current month
  const timestamps = rows
    .map((r) => parseDisplayDate(r['Payment Date']))
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b);
  
  if (timestamps.length === 0) {
    window.State.chartInstances.growthChart.data.labels = [];
    window.State.chartInstances.growthChart.data.datasets[0].data = [];
    window.State.chartInstances.growthChart.update();
    return;
  }
  
  const first = new Date(timestamps[0]);
  const today = new Date();
  
  // Calculate total months span
  const totalMonths = (today.getFullYear() - first.getFullYear()) * 12 + 
                     (today.getMonth() - first.getMonth()) + 1;
  
  // Determine grouping strategy based on total months
  let groupSize, labelFormat;
  if (totalMonths <= 12) {
    groupSize = 1; // Monthly
    labelFormat = 'MM/YYYY';
  } else if (totalMonths <= 36) {
    groupSize = 3; // Quarterly
    labelFormat = 'Q YYYY';
  } else if (totalMonths <= 72) {
    groupSize = 6; // Semi-annually
    labelFormat = 'MM/YYYY';
  } else {
    groupSize = 12; // Annually
    labelFormat = 'YYYY';
  }

  const labels = [];
  const keyToIndex = new Map();
  const sums = [];
  
  function keyFor(d) { 
    if (groupSize === 1) {
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    } else if (groupSize === 3) {
      const quarter = Math.floor(d.getMonth() / 3) + 1;
      return `${d.getFullYear()}-Q${quarter}`;
    } else if (groupSize === 6) {
      const half = Math.floor(d.getMonth() / 6) + 1;
      return `${d.getFullYear()}-H${half}`;
    } else {
      return `${d.getFullYear()}`;
    }
  }
  
  function labelFor(d) { 
    if (groupSize === 1) {
      return `${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    } else if (groupSize === 3) {
      const quarter = Math.floor(d.getMonth() / 3) + 1;
      return `Q${quarter} ${d.getFullYear()}`;
    } else if (groupSize === 6) {
      const half = Math.floor(d.getMonth() / 6) + 1;
      const month = half === 1 ? '06' : '12';
      return `${month}/${d.getFullYear()}`;
    } else {
      return `${d.getFullYear()}`;
    }
  }
  
  // Iterate groups from first to today
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth(), 1);
  
  while (cursor <= end) {
    const key = keyFor(cursor);
    if (!keyToIndex.has(key)) {
      keyToIndex.set(key, labels.length);
      labels.push(labelFor(cursor));
      sums.push(0);
    }
    cursor.setMonth(cursor.getMonth() + groupSize);
  }

  // Sum values into group buckets
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

  // Turn into cumulative
  let running = 0;
  const cumulative = sums.map((n) => { running += n; return Number(running.toFixed(2)); });
  
  window.State.chartInstances.growthChart.data.labels = labels;
  window.State.chartInstances.growthChart.data.datasets[0].data = cumulative;
  
  // Ensure Y axis has headroom so top labels are not cropped
  const maxCumulative = Math.max(...cumulative);
  window.State.chartInstances.growthChart.options.scales.y.suggestedMax = Number((maxCumulative * 1.15).toFixed(2));
  
  // Update Y-axis ticks to show currency
  if (window.State.chartInstances.growthChart.options.scales && window.State.chartInstances.growthChart.options.scales.y) {
    window.State.chartInstances.growthChart.options.scales.y.ticks = {
      callback: function(value) {
        return `${symbol ? symbol + ' ' : ''}${Number(value).toFixed(0)}`;
      }
    };
  }
  
  // Update datalabels with currency symbol
  if (window.ChartDataLabels && window.State.chartInstances.growthChart.options.plugins.datalabels) {
    window.State.chartInstances.growthChart.options.plugins.datalabels.formatter = (v) => `${symbol ? symbol + ' ' : ''}${Number(v).toFixed(2)}`;
  }
  
  window.State.chartInstances.growthChart.update();
}

// Export functions to global scope
window.Charts = {
  initChartIfReady,
  initGrowthChartIfReady,
  updateChart,
  updateGrowthChart
};
