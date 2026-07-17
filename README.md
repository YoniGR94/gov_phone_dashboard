# Government Mobile Leasing Dashboard

An interactive cost calculator for Israeli government employees enrolled in the government mobile-phone leasing program — select a rank and a device, get the real monthly and lifetime cost.

🔗 **[Live demo](https://gov-phone-dashboard.vercel.app/)**

<!-- Add screenshot here: <img src="https://.../screenshot.png" width="600"/> -->

## What it does

Users pick their employment group, rank, and a device model. The dashboard then calculates:

- Monthly employee cost
- Monthly ministry participation
- Device buyout cost at the end of the lease period
- Total 24-month ownership cost
- Early termination cost for any month of the lease
- Side-by-side comparisons across available devices

The goal is transparency — most employees never see these numbers broken down before signing up for a device.

## Getting Started

```bash
git clone https://github.com/YoniGR94/gov_phone_dashboard.git
cd gov_phone_dashboard
npm install
npm run dev
```

## Features

### Step 1 — Employee & Device Selection
Users choose a device model, employment group (Academic, Administrative, Military, etc.), and rank. The app automatically maps the selected rank to the correct participation tier.

### Step 2 — Dashboard
Displays monthly employee payment, monthly government participation, end-of-lease buyout price, accumulated cost over time, an early-termination simulation, and device comparison charts.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| CSV parsing | PapaParse |
| Backend | Vercel Serverless Function (`/api/devices`) |
| Analytics | Vercel Analytics |
| Deployment | Vercel |

## Data Sources

**Devices** — pulled live from a Google Sheet, but not fetched directly from the browser. A Vercel serverless function (`api/devices.ts`) fetches and parses the sheet server-side: this avoids CORS failures on Google's CSV export endpoint, handles the sheet's two-row header layout, drops any row with unparseable pricing data instead of silently showing ₪0, and caches the result at the edge (`s-maxage=3600, stale-while-revalidate=86400`) so Google isn't hit on every request.

**Business rules** — grade bands, participation tiers, government contribution rules, early termination formulas, and ministry/rank mappings are stored locally as JSON in `public/data/`.

## Repository Structure

```
├── api/
│   └── devices.ts          # Serverless function: fetch + parse live device sheet
├── public/data/
│   ├── gradeBands.json
│   ├── gradeLookup.json
│   └── terminationRules.json
├── src/
│   ├── components/         # DeviceSelector, GradeSelector, Charts, SummaryCards
│   ├── pages/               # SelectionPage, DashboardPage
│   ├── services/             # data.ts (fetching), calculations.ts (cost logic)
│   └── types.ts
└── deep-research-report.md  # Original planning / architecture doc
```

## Limitations

- The device list depends on the live structure of the source Google Sheet — if the column layout changes, `api/devices.ts` needs a matching update.
- No automated test suite yet; correctness is currently verified manually against the source spreadsheet.
- Business rules (grade bands, tiers) are static JSON, not admin-editable — updating them requires a code change and redeploy.

## Author

Yoni Getahun · [LinkedIn](https://www.linkedin.com/in/yoni-getahun/) · [GitHub](https://github.com/YoniGR94/gov_phone_dashboard)
