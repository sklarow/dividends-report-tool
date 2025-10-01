# 📊 Dividends Report Tool

A modern, interactive web application for analyzing dividend investment data with comprehensive reporting, charts, and insights.

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
- **Smart Dynamic Grouping** based on data span:
  - **≤ 12 months**: Monthly view (`MM/YYYY`)
  - **13-36 months**: Quarterly view (`Q YYYY`)
  - **37-72 months**: Semi-annual view (`MM/YYYY`)
  - **> 72 months**: Annual view (`YYYY`)
- Prevents overcrowded x-axis labels for long time periods

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

### **Architecture**
- **Frontend**: Pure HTML, CSS, JavaScript (no frameworks)
- **CSV Parsing**: Papa Parse library
- **Charts**: Chart.js with datalabels plugin
- **Styling**: Modern CSS with responsive design

### **Key Features**
- **Client-side processing**: All data processing happens in the browser
- **No server required**: Works entirely in the browser
- **Responsive design**: Adapts to different screen sizes
- **Modular code**: Separated into `app.js` and `utils.js` for maintainability

### **Browser Compatibility**
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🔧 Customization

### **Adding New Currencies**
Edit `js/utils.js` and add new entries to the `currencySymbolFrom` function:

```javascript
const map = {
  "USD": "$",
  "EUR": "€",
  "GBP": "£",
  // Add your currency here
  "NEW_CURRENCY": "NEW_SYMBOL",
};
```

### **Modifying Chart Grouping**
Edit the grouping logic in `js/app.js` `updateGrowthChart()` function:

```javascript
if (totalMonths <= 12) {
  groupSize = 1; // Monthly
} else if (totalMonths <= 36) {
  groupSize = 3; // Quarterly
} // ... modify thresholds as needed
```

### **Styling Changes**
All styles are in `styles.css`. Key classes:
- `.overview-card`: Payment overview styling
- `.chart-card`: Chart container styling
- `.value-positive`: Green value styling
- `.pagination-bar`: Pagination controls

## 🐛 Troubleshooting

### **CSV File Not Loading**
- **Issue**: "CORS policy" error in browser console
- **Solution**: Serve files through a web server (see Installation section)

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

If you encounter any issues or have questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Search existing [Issues](https://github.com/sklarow/dividends-report-tool/issues)
3. Create a new issue with detailed information

## 🎯 Roadmap

- [ ] Export functionality (PDF, Excel)
- [ ] Additional chart types (pie charts, heatmaps)
- [ ] Data filtering and search
- [ ] Multiple portfolio support
- [ ] Dividend yield calculations
- [ ] Performance metrics (IRR, CAGR)

---

**Made with ❤️ for dividend investors**
