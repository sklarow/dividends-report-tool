# 📊 Dividend Growth Tracker

A modern, interactive web application for analyzing Trading212 dividend investment data with comprehensive reporting, charts, and insights. Turn your Trading212 history into insights and charts.

## ✨ Features

### 📈 **Payments Overview Dashboard**
- **First Payment Date**: When your dividend history begins
- **Last Payment Date**: Most recent dividend received
- **Total Payments Count**: Number of dividend transactions
- **Total Amount Received**: Cumulative dividends (displayed in green)
- **Average Payment Size**: Mean dividend amount per transaction
- **Largest Single Payment**: Biggest dividend with ticker, company name, and date

### 📊 **Interactive Charts**

#### **Payments in the Last 12 Months**
- Bar chart showing monthly dividend payments
- Bold green values with currency symbols on top of bars
- Automatically adjusts Y-axis to prevent label cropping

#### **Cumulative Dividend Growth**
- Line chart showing cumulative dividend growth over time
- **Beautiful purple theme** with animated gradient styling
- **Bold green value labels** on each data point with currency symbols
- **Smart Dynamic Grouping** based on data span:
  - **≤ 12 months**: Monthly view (`MM/YYYY`)
  - **13-36 months**: Quarterly view (`Q YYYY`)
  - **37-72 months**: Semi-annual view (`MM/YYYY`)
  - **> 72 months**: Annual view (`YYYY`)
- Prevents overcrowded x-axis labels for long time periods
- Y-axis headroom prevents label cropping

### 📋 **Data Tables**

#### **All Dividend Transactions**
- Complete transaction history in an expandable accordion
- **Default sorting**: Payment Date (newest first)
- **Features**:
  - Client-side sorting on all columns
  - Pagination with customizable page sizes
  - Currency symbols (€, $, £, etc.) next to values
  - Date formatting: `dd/mm/yyyy HH:MM`

#### **Total Payments by Ticker**
- Aggregated view by stock ticker
- **Default sorting**: Total Payments (biggest first)
- **Columns**:
  - Ticker symbol
  - Company name
  - Number of payments
  - Total payments (green and bold)
  - Average payment size
- **Features**:
  - Client-side sorting and pagination
  - Unique ticker aggregation

### 💱 **Currency Support**
- Automatic currency symbol detection from CSV data
- Supports major currencies: USD ($), EUR (€), GBP (£), JPY (¥), CAD (C$), AUD (A$), CHF, CNY, SEK, NZD, MXN, SGD, HKD, NOK, KRW, TRY, RUB, INR, BRL, ZAR
- Fallback to currency code if symbol not found



## 📄 CSV Format

The application expects a CSV file with the following structure:

```csv
Action,Time,ISIN,Ticker,Name,No. of shares,Price / share,Currency (Price / share),Exchange rate,Total,Currency (Total),Withholding tax,Currency (Withholding tax)
Dividend (Dividend),2025-01-15 10:30:00,US0378331005,AAPL,Apple Inc,0.5000000000,0.240000,USD,Not available,0.12,EUR,0.02,USD
```

### Required Columns:
- **Action**: Transaction type (e.g., "Dividend (Dividend)")
- **Time**: Payment date and time (`yyyy-mm-dd HH:MM:SS`)
- **ISIN**: International Securities Identification Number
- **Ticker**: Stock symbol
- **Name**: Company name
- **No. of shares**: Number of shares
- **Price / share**: Dividend per share
- **Currency (Price / share)**: Currency of per-share price
- **Exchange rate**: Exchange rate (if applicable)
- **Total**: Total dividend amount
- **Currency (Total)**: Currency of total amount ⭐ **Important for currency detection**
- **Withholding tax**: Tax withheld
- **Currency (Withholding tax)**: Currency of withholding tax

## 🏗️ Project Structure

```
dividends-report-tool/
├── index.html          # Main HTML structure
├── styles.css          # CSS styling
├── js/
│   ├── app.js          # Main application logic
│   └── utils.js        # Utility functions
├── dividends.csv       # Your dividend data (ignored by git)
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## 🛠️ Technical Details

- **Pure HTML/CSS/JavaScript** - No frameworks required
- **Client-side processing** - All data stays in your browser
- **Chart.js** for interactive charts
- **Papa Parse** for CSV processing

## 🚀 Quick Start

### **Option 1: GitHub Pages (Recommended)**
1. Visit: [https://sklarow.github.io/dividends-report-tool](https://sklarow.github.io/dividends-report-tool)
2. Upload your Trading212 dividend CSV file
3. View your analysis instantly

### **Option 2: Local Development**
1. Clone: `git clone https://github.com/sklarow/dividends-report-tool.git`
2. Serve locally: `python -m http.server 8000` (or any web server)
3. Open: `http://localhost:8000`

## 🐛 Troubleshooting

### **CSV File Not Loading**
- **Issue**: "CORS policy" error in browser console
- **Solution**: Deploy to GitHub Pages or serve files through a web server (see Installation section)
- **GitHub Pages**: Automatically fixes CORS issues when deployed

### **Charts Not Rendering**
- **Issue**: Charts appear blank
- **Solution**: Check browser console for JavaScript errors, ensure Chart.js is loaded

### **Currency Symbols Not Showing**
- **Issue**: Currency codes instead of symbols
- **Solution**: Verify `Currency (Total)` column exists in CSV and contains valid currency codes

### **Date Formatting Issues**
- **Issue**: Dates not displaying correctly
- **Solution**: Ensure CSV dates are in `yyyy-mm-dd HH:MM:SS` format

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

Found an issue? [Create a GitHub issue](https://github.com/sklarow/dividends-report-tool/issues) with details.


## 🎯 Roadmap

- [ ] Export functionality (PDF, Excel)
- [ ] Additional chart types (pie charts, heatmaps)
- [ ] Data filtering and search
- [ ] Multiple portfolio support
- [ ] Dividend yield calculations
- [ ] Performance metrics (IRR, CAGR)

## ⚠️ Disclaimer

**Disclaimer:** This is an independent project made by [Allan Sklarow](https://linkedin.com/in/sklarow) and is not affiliated with or endorsed by Trading 212. Your files remain private: all processing is done locally in your browser, and no data is saved or transmitted. [View the source code on GitHub](https://github.com/sklarow/dividends-report-tool)

---

**Made with ❤️ for dividend investors**
