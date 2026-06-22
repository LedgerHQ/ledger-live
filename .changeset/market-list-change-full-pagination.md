---
"@ledgerhq/live-common": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Fix the Market list "% change" sort (top gainers/losers) being stuck on the first page: the global, unfiltered gainers/losers request no longer sends `top=100`, so the list now paginates through all coins like the market-cap and stocks lists. The Market Banner top performers are unaffected (they use the separate `getMarketPerformers` endpoint with its own `top` cap).
