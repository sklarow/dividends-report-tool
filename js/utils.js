// Utilities shared across the dividend table app

// Common currency symbol mapping by code and common names
const CURRENCY_SYMBOLS = {
  usd: "$",
  eur: "€",
  gbp: "£",
  jpy: "¥",
  cny: "¥",
  hkd: "HK$",
  chf: "CHF",
  cad: "CA$",
  aud: "A$",
  nzd: "NZ$",
  sek: "kr",
  nok: "kr",
  dkk: "kr",
  pln: "zł",
  czk: "Kč",
  huf: "Ft",
  zar: "R",
  brl: "R$",
  mxn: "MX$",
  inr: "₹",
  sgd: "S$",
  krw: "₩",
  try: "₺",
  rub: "₽",
  ils: "₪",
};

/**
 * Convert various date string inputs into display format dd/mm/yyyy HH:MM.
 * Accepts YYYY-MM-DD[, HH:MM[:SS]] and generic Date-parseable strings.
 * Returns the original value if parsing fails.
 * @param {string} input
 * @returns {string}
 */
function formatDateDisplay(input) {
  const value = String(input ?? "").trim();
  if (value === "") return "";

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
    const d = new Date(year, month - 1, day, hour, minute, 0, 0);
    const dd = pad2(d.getDate());
    const mm = pad2(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    const hh = pad2(d.getHours());
    const min = pad2(d.getMinutes());
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }

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

/**
 * Build a relaxed header map from the provided CSV header names.
 * Maps common variants like "No. of shares" -> shares, and "Time" -> date.
 * @param {string[]} headers
 * @returns {{ticker?: string, name?: string, shares?: string, date?: string, value?: string}}
 */
function buildHeaderMap(headers) {
  const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  const candidates = headers.map((h) => ({ raw: h, key: norm(h) }));

  function find() {
    const keys = Array.from(arguments);
    const set = new Set(keys.map(norm));
    const hit = candidates.find((c) => set.has(c.key));
    return hit ? hit.raw : undefined;
  }

  return {
    ticker: find("ticker", "symbol"),
    name: find("ticker name", "name", "company", "instrument"),
    shares: find("number of shares", "no. of shares", "shares"),
    date: find("payment date", "date", "time"),
    value: find("value", "amount", "total", "total (gbp)", "gross amount"),
    // Prefer the model column "Currency (Total)", with robust fallbacks
    currency: find(
      "currency (total)",
      "currency",
      "currency (withholding tax)",
      "currency (price / share)"
    ),
  };
}

/**
 * Extract a Number from a mixed string like "$1,234.56".
 * Returns NaN if there is no numeric content.
 * @param {string|number} input
 * @returns {number}
 */
function numberFromMixedString(input) {
  return Number(String(input).replace(/[^0-9.-]/g, ""));
}

/**
 * Given a currency code or name (e.g., "EUR", "Euro"), return a symbol.
 * Falls back to the provided input (trimmed) if unknown.
 * @param {string} codeOrName
 * @returns {string}
 */
function currencySymbolFrom(codeOrName) {
  const raw = String(codeOrName || "").trim().replace(/^"|"$/g, "");
  if (!raw) return "";
  const lc = raw.toLowerCase();

  // Try exact code or common name keys
  if (CURRENCY_SYMBOLS[lc]) return CURRENCY_SYMBOLS[lc];

  // Map a few common full names to codes
  const nameToCode = {
    euro: "eur",
    dollar: "usd",
    "us dollar": "usd",
    "canadian dollar": "cad",
    "australian dollar": "aud",
    pound: "gbp",
    "pound sterling": "gbp",
    yen: "jpy",
    yuan: "cny",
    franc: "chf",
    rupee: "inr",
    real: "brl",
    rand: "zar",
    peso: "mxn",
    won: "krw",
    lira: "try",
    ruble: "rub",
    shekel: "ils",
  };
  const mapped = nameToCode[lc];
  if (mapped && CURRENCY_SYMBOLS[mapped]) return CURRENCY_SYMBOLS[mapped];

  // Fallback to the original currency name/code
  return raw;
}

// Expose as global utilities to avoid module tooling
window.Utils = { formatDateDisplay, buildHeaderMap, numberFromMixedString, currencySymbolFrom };


