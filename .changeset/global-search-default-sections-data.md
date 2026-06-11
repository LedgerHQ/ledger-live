---
"@ledgerhq/live-common": minor
"live-mobile": minor
"ledger-live-desktop": patch
---

Add the Global Search default-sections data on mobile, fed by DADA. Cryptos (top 3) and stablecoins (top 2) render as market rows; stocks (top 10) as pills.

Share the DADA asset-discovery selection in `@ledgerhq/live-common` (`selectTopStocks`, `selectTopAssetsByCategory`, `StockSuggestion`) so desktop and mobile use one implementation; desktop's stocks section now consumes `selectTopStocks` instead of its own copy.
