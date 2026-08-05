---
"@shared/api-services": minor
"@domain/api-altcoins-sentiment": minor
"@domain/api-market-sentiment": minor
"@domain/api-currency-token": minor
"@domain/api-currency-fiat": minor
"@domain/api-push-devices": minor
"@features/platform-currencies": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/web-tools": minor
"@ledgerhq/live-cli": minor
---

Split backend access from use case in the RTK Query layer

`@shared/api-services` now holds one endpoint-less `createApi` per backend (CAL, CoinMarketCap,
Countervalues, Push Devices), owning its base query, `extraArgument` contract and reducer path.
`domain/api/*` packages add their endpoints with `injectEndpoints` and their own cache tags with
`enhanceEndpoints`, so one reducer, middleware and cache now serve every use case on a backend — the two
CoinMarketCap packages previously had one each. Apps register the service apis.

`extraArgument` builder names are unchanged, so only import paths move. Reducer paths are renamed after
their backend (`calApi`, `coinMarketCapApi`, `countervaluesApi`); no persisted data and no endpoint
behaviour is affected.
