---
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/live-common": minor
---

Migrate Market Detail chart from the deprecated CoinGecko `market_chart` endpoint to the new Countervalue Service (CVS) time-granularity endpoints (`/v3/markets/chart/{range}/{id}`). Adds a `getAssetChartData` RTK Query endpoint on the market API and removes the now-unused `getCurrencyChartData` query and related helpers from `cg-client`.
