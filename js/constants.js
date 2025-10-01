// Constants and configuration for the dividend tracker

/**
 * Columns expected for rendering the main table.
 * @type {readonly string[]}
 */
const REQUIRED_COLUMNS = [
  "Ticker",
  "Ticker Name", 
  "Number of Shares",
  "Payment Date",
  "Value"
];

/**
 * Inline fallback sample CSV when local fetch is not available.
 * Contains anonymized sample data for demonstration purposes.
 * @type {string}
 */
const INLINE_SAMPLE_CSV = `Action,Time,ISIN,Ticker,Name,No. of shares,Price / share,Currency (Price / share),Exchange rate,Total,Currency (Total),Withholding tax,Currency (Withholding tax)
Dividend (Dividend),2010-06-15 10:30:00,US0378331005,AAPL,Apple Inc,0.2000000000,0.120000,USD,Not available,0.02,EUR,0.00,USD
Dividend (Dividend),2010-12-15 10:30:00,US5949181045,MSFT,Microsoft Corp,0.1000000000,0.160000,USD,Not available,0.02,EUR,0.00,USD
Dividend (Dividend),2013-03-15 10:30:00,US92826C8394,V,Visa Inc,0.1500000000,0.200000,USD,Not available,0.03,EUR,0.01,USD
Dividend (Dividend),2013-09-15 10:30:00,US1912161007,KO,Coca-Cola Co,0.5000000000,0.280000,USD,Not available,0.14,EUR,0.03,USD
Dividend (Dividend),2015-01-15 10:30:00,US0378331005,AAPL,Apple Inc,0.3000000000,0.200000,USD,Not available,0.06,EUR,0.01,USD
Dividend (Dividend),2015-07-15 10:30:00,US5949181045,MSFT,Microsoft Corp,0.2000000000,0.310000,USD,Not available,0.06,EUR,0.01,USD
Dividend (Dividend),2024-11-15 10:30:00,US0378331005,AAPL,Apple Inc,0.5000000000,0.240000,USD,Not available,0.12,EUR,0.02,USD
Dividend (Dividend),2024-12-15 10:30:00,US5949181045,MSFT,Microsoft Corp,0.3000000000,0.750000,USD,Not available,0.23,EUR,0.05,USD
Dividend (Dividend),2025-01-15 10:30:00,US92826C8394,V,Visa Inc,0.2000000000,0.450000,USD,Not available,0.09,EUR,0.02,USD
Dividend (Dividend),2025-02-15 10:30:00,US1912161007,KO,Coca-Cola Co,1.0000000000,0.460000,USD,Not available,0.46,EUR,0.09,USD
Dividend (Dividend),2025-03-15 10:30:00,US0378331005,AAPL,Apple Inc,0.5000000000,0.240000,USD,Not available,0.12,EUR,0.02,USD
Dividend (Dividend),2025-04-15 10:30:00,US5949181045,MSFT,Microsoft Corp,0.3000000000,0.750000,USD,Not available,0.23,EUR,0.05,USD
Dividend (Dividend),2025-05-15 10:30:00,US92826C8394,V,Visa Inc,0.2000000000,0.450000,USD,Not available,0.09,EUR,0.02,USD
Dividend (Dividend),2025-06-15 10:30:00,US1912161007,KO,Coca-Cola Co,1.0000000000,0.460000,USD,Not available,0.46,EUR,0.09,USD
Dividend (Dividend),2025-07-15 10:30:00,US0378331005,AAPL,Apple Inc,0.5000000000,0.240000,USD,Not available,0.12,EUR,0.02,USD
Dividend (Dividend),2025-08-15 10:30:00,US5949181045,MSFT,Microsoft Corp,0.3000000000,0.750000,USD,Not available,0.23,EUR,0.05,USD
Dividend (Dividend),2025-09-15 10:30:00,US92826C8394,V,Visa Inc,0.2000000000,0.450000,USD,Not available,0.09,EUR,0.02,USD
Dividend (Dividend),2025-10-15 10:30:00,US1912161007,KO,Coca-Cola Co,1.0000000000,0.460000,USD,Not available,0.46,EUR,0.09,USD`;

// Export constants to global scope
window.Constants = {
  REQUIRED_COLUMNS,
  INLINE_SAMPLE_CSV
};
