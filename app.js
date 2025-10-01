// Minimal helpers for rendering and parsing

const REQUIRED_COLUMNS = [
  "Ticker",
  "Ticker Name",
  "Number of Shares",
  "Payment Date",
  "Value"
];

const INLINE_SAMPLE_CSV = `Ticker,Ticker Name,Number of Shares,Payment Date,Value\nAAPL,Apple Inc,10,2025-08-15,5.40\nMSFT,Microsoft Corp,8,2025-08-20,4.16\nV,Visa Inc,5,2025-09-02,2.85\nKO,Coca-Cola Co,20,2025-09-10,3.40`;

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("file-input");
  input.addEventListener("change", onFileSelected);

  // Load sample CSV initially
  loadSampleCsv();
});

function formatDateDisplay(input) {
  const value = String(input ?? "").trim();
  if (value === "") return "";

  // Try common formats: YYYY-MM-DD, YYYY-MM-DD HH:MM, YYYY-MM-DD HH:MM:SS
  const ymd = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;
  const ymdHm = /^([0-9]{4})-([0-9]{2})-([0-9]{2})[ T]([0-9]{2}):([0-9]{2})(?::([0-9]{2}))?$/;

  let year, month, day, hour = 0, minute = 0;

  let m = value.match(ymd);
  if (m) {
    year = Number(m[1]);
    month = Number(m[2]);
    day = Number(m[3]);
  } else {
    m = value.match(ymdHm);
    if (m) {
      year = Number(m[1]);
      month = Number(m[2]);
      day = Number(m[3]);
      hour = Number(m[4]);
      minute = Number(m[5]);
    }
  }

  function pad2(n) { return String(n).padStart(2, "0"); }

  if (year && month && day) {
    // Construct using local time to avoid timezone shifts
    const d = new Date(year, month - 1, day, hour, minute, 0, 0);
    const dd = pad2(d.getDate());
    const mm = pad2(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    const hh = pad2(d.getHours());
    const min = pad2(d.getMinutes());
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }

  // Fallback: try Date parsing; if invalid, return original
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }

  return value;
}

function onFileSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => parseCsvAndRender(reader.result);
  reader.onerror = () => alert("Failed to read the selected file.");
  reader.readAsText(file);
}

async function loadSampleCsv() {
  try {
    // Try fetching a sample from project root
    const response = await fetch("./dividends.csv", { cache: "no-store" });
    if (!response.ok) throw new Error("Sample CSV not found");
    const text = await response.text();
    parseCsvAndRender(text);
  } catch (err) {
    // Fallback to inline sample to avoid local file:// CORS issues
    parseCsvAndRender(INLINE_SAMPLE_CSV);
  }
}

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
  renderTable(normalizedRows);
}

function normalizeRowKeys(row) {
  // Accept minor header variations commonly seen in exports
  const map = buildHeaderMap(Object.keys(row));
  return {
    "Ticker": row[map.ticker] ?? "",
    "Ticker Name": row[map.name] ?? "",
    "Number of Shares": row[map.shares] ?? "",
    "Payment Date": formatDateDisplay(row[map.date] ?? ""),
    "Value": row[map.value] ?? "",
  };
}

function buildHeaderMap(headers) {
  const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  const candidates = headers.map((h) => ({ raw: h, key: norm(h) }));

  function find(...keys) {
    const set = new Set(keys.map(norm));
    const hit = candidates.find((c) => set.has(c.key));
    return hit ? hit.raw : undefined;
  }

  return {
    ticker: find("ticker", "symbol"),
    name: find("ticker name", "name", "company", "instrument"),
    shares: find("number of shares", "no. of shares", "shares"),
    // Some exports use a separate Time column; treat it as the date-time
    date: find("payment date", "date", "time"),
    value: find("value", "amount", "total", "total (gbp)", "gross amount"),
  };
}

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
        const num = Number(String(value).replace(/[^0-9.-]/g, ""));
        if (!Number.isNaN(num)) value = num.toFixed(2);
      }
      td.textContent = value;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}



