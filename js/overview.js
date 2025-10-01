// Overview dashboard functionality

/**
 * Compute and render Payments Overview metrics using all rows (not paginated slice).
 */
function renderOverview() {
  const rows = window.State.tableState.rows; // already sorted if requested
  if (!rows || rows.length === 0) {
    setOverviewText('ov-first', '—');
    setOverviewText('ov-last', '—');
    setOverviewText('ov-count', '0');
    setOverviewText('ov-total', '—');
    setOverviewText('ov-total-30', '—');
    setOverviewText('ov-total-365', '—');
    setOverviewText('ov-avg', '—');
    setOverviewText('ov-avg-month', '—');
    setOverviewText('ov-max', '—');
    setOverviewText('ov-most', '—');
    setOverviewText('ov-biggest', '—');
    setOverviewText('ov-lowest', '—');
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
  let totalAmount30 = 0;
  let totalAmount365 = 0;
  let count = 0;
  let maxPayment = { amount: -Infinity, row: null };
  
  // Track payments by ticker
  const tickerStats = {};
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const threeHundredSixtyFiveDaysAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
  
  for (const r of rows) {
    const num = window.Utils.numberFromMixedString(r['Value']);
    if (Number.isNaN(num)) continue;
    
    const paymentDate = parseDisplayDate(r['Payment Date']);
    if (!Number.isFinite(paymentDate)) continue;
    
    count += 1;
    totalAmount += num;
    
    // Check if payment is within last 30 days
    if (paymentDate >= thirtyDaysAgo.getTime()) {
      totalAmount30 += num;
    }
    
    // Check if payment is within last 365 days
    if (paymentDate >= threeHundredSixtyFiveDaysAgo.getTime()) {
      totalAmount365 += num;
    }
    
    if (num > maxPayment.amount) maxPayment = { amount: num, row: r };
    
    // Track by ticker
    const ticker = r['Ticker'] || 'Unknown';
    if (!tickerStats[ticker]) {
      tickerStats[ticker] = { count: 0, total: 0, name: r['Ticker Name'] || '' };
    }
    tickerStats[ticker].count += 1;
    tickerStats[ticker].total += num;
  }
  const avg = count > 0 ? totalAmount / count : 0;
  
  // Find ticker with most payments, biggest accumulated payer, and lowest accumulated payer
  let mostPayments = { count: 0, ticker: '', name: '', total: 0 };
  let biggestPayer = { total: 0, ticker: '', name: '', count: 0 };
  let lowestPayer = { total: Infinity, ticker: '', name: '', count: 0 };
  
  for (const [ticker, stats] of Object.entries(tickerStats)) {
    if (stats.count > mostPayments.count) {
      mostPayments = { count: stats.count, ticker, name: stats.name, total: stats.total };
    }
    if (stats.total > biggestPayer.total) {
      biggestPayer = { total: stats.total, ticker, name: stats.name, count: stats.count };
    }
    if (stats.total < lowestPayer.total) {
      lowestPayer = { total: stats.total, ticker, name: stats.name, count: stats.count };
    }
  }
  
  // If no valid lowest payer found, reset to default
  if (lowestPayer.total === Infinity) {
    lowestPayer = { total: 0, ticker: '', name: '', count: 0 };
  }

  // Currency symbol: prefer first row's currency (assumes consistent file currency)
  const currency = rows.find((r) => r['_Currency'])?._Currency || '';
  const symbol = window.Utils.currencySymbolFrom(currency);
  const money = (n) => `${symbol ? symbol + ' ' : ''}${n.toFixed(2)}`;

  setOverviewText('ov-first', first ? first.row['Payment Date'] : '—');
  setOverviewText('ov-last', last ? last.row['Payment Date'] : '—');
  setOverviewText('ov-count', String(count));
  
  // All time total
  const totalEl = document.getElementById('ov-total');
  if (totalEl) {
    totalEl.textContent = count > 0 ? money(totalAmount) : '—';
    totalEl.classList.toggle('value-positive', count > 0);
  }
  
  // 30 days total
  const total30El = document.getElementById('ov-total-30');
  if (total30El) {
    total30El.textContent = totalAmount30 > 0 ? money(totalAmount30) : '—';
    total30El.classList.toggle('value-positive', totalAmount30 > 0);
  }
  
  // 365 days total
  const total365El = document.getElementById('ov-total-365');
  if (total365El) {
    total365El.textContent = totalAmount365 > 0 ? money(totalAmount365) : '—';
    total365El.classList.toggle('value-positive', totalAmount365 > 0);
  }
  
  setOverviewText('ov-avg', count > 0 ? money(avg) : '—');
  
  // Average payment per month (last 365 days / 12)
  const avgPerMonth = totalAmount365 / 12;
  const avgMonthEl = document.getElementById('ov-avg-month');
  if (avgMonthEl) {
    avgMonthEl.textContent = totalAmount365 > 0 ? money(avgPerMonth) : '—';
    avgMonthEl.classList.toggle('value-positive', totalAmount365 > 0);
  }
  
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
  
  // Most payments
  if (mostPayments.count > 0) {
    const mostEl = document.getElementById('ov-most');
    if (mostEl) {
      mostEl.innerHTML = '';
      const wrapper = document.createElement('div');
      wrapper.className = 'value-multiline';
      const v1 = document.createElement('div');
      v1.textContent = `${mostPayments.count} payments`;
      const v2 = document.createElement('div');
      v2.textContent = mostPayments.ticker;
      const v3 = document.createElement('div');
      v3.className = 'sub';
      v3.textContent = mostPayments.name;
      const v4 = document.createElement('div');
      v4.textContent = money(mostPayments.total);
      wrapper.appendChild(v1);
      wrapper.appendChild(v2);
      wrapper.appendChild(v3);
      wrapper.appendChild(v4);
      mostEl.appendChild(wrapper);
    }
  } else {
    setOverviewText('ov-most', '—');
  }
  
  // Biggest accumulated payer
  if (biggestPayer.total > 0) {
    const biggestEl = document.getElementById('ov-biggest');
    if (biggestEl) {
      biggestEl.innerHTML = '';
      const wrapper = document.createElement('div');
      wrapper.className = 'value-multiline';
      const v1 = document.createElement('div');
      v1.textContent = money(biggestPayer.total);
      const v2 = document.createElement('div');
      v2.textContent = biggestPayer.ticker;
      const v3 = document.createElement('div');
      v3.className = 'sub';
      v3.textContent = biggestPayer.name;
      const v4 = document.createElement('div');
      v4.textContent = `${biggestPayer.count} payments`;
      wrapper.appendChild(v1);
      wrapper.appendChild(v2);
      wrapper.appendChild(v3);
      wrapper.appendChild(v4);
      biggestEl.appendChild(wrapper);
    }
  } else {
    setOverviewText('ov-biggest', '—');
  }
  
  // Lowest accumulated payer
  if (lowestPayer.total > 0) {
    const lowestEl = document.getElementById('ov-lowest');
    if (lowestEl) {
      lowestEl.innerHTML = '';
      const wrapper = document.createElement('div');
      wrapper.className = 'value-multiline';
      const v1 = document.createElement('div');
      v1.textContent = money(lowestPayer.total);
      const v2 = document.createElement('div');
      v2.textContent = lowestPayer.ticker;
      const v3 = document.createElement('div');
      v3.className = 'sub';
      v3.textContent = lowestPayer.name;
      const v4 = document.createElement('div');
      v4.textContent = `${lowestPayer.count} payments`;
      wrapper.appendChild(v1);
      wrapper.appendChild(v2);
      wrapper.appendChild(v3);
      wrapper.appendChild(v4);
      lowestEl.appendChild(wrapper);
    }
  } else {
    setOverviewText('ov-lowest', '—');
  }
}

/**
 * Helper to set overview text content safely.
 * @param {string} id - Element ID to update
 * @param {string} text - Text content to set
 */
function setOverviewText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// Export functions to global scope
window.Overview = {
  renderOverview,
  setOverviewText
};
