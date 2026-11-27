---
"@ledgerhq/live-common": minor
"@domain/api-market-index-global": minor
"live-mobile": minor
"ledger-live-desktop": minor
---

Migrate useGlobalMarketData to @domain/api-market-index-global and remove the live-common hook and its useMarketDataProvider re-export. Use `useGetGlobalMarketDataQuery` from `@domain/api-market-index-global` instead.
