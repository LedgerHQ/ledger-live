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

Split backend access from use case in `domain/api` using RTK Query `injectEndpoints`

`@shared/api-services` now holds one endpoint-less `createApi({ endpoints: () => ({}) })` per backend —
CAL, CoinMarketCap, Countervalues and Push Devices — each owning only that backend's `extraArgument`
contract, a transport-only base query and its reducer path. Use-case packages add their endpoints with
`injectEndpoints`, so a single reducer, middleware and cache serve every use case on a given backend.

Cache tags stay with the endpoints that provide them: each use-case package declares its own and
registers them on the shared api with `enhanceEndpoints({ addTagTypes })`, which mutates and returns
that same api. So adding a use case never means editing another backend's file.

CoinMarketCap previously had two independent `createApi` instances (altcoins-sentiment and
market-sentiment) against the same base URL, duplicating the base query, the `extraArgument` schema and
the cache-timing constants. They now share one.

The app store registries register the service apis, so they read as a list of the backends the app talks
to rather than of its use cases. Reducer paths are named after their backend: `calApi`,
`coinMarketCapApi`, `countervaluesApi`, `pushDevicesApi`. No persisted data is affected — the CAL cache
blob is a version-pinned custom format that contains no reducer path.

`extraArgument` builders keep their existing names (`calApiExtra`, `cvsApiExtra`,
`pushDevicesApiExtra`), so call sites are unchanged and only import paths move. `coinMarketCapApiExtra`
replaces the two identical sentiment builders.

No endpoint behaviour changes: bodies, names, tags, transforms and cache settings are unchanged.

`@domain/api-pay-card` is untouched in this change and is the only backend still declaring its own
`createApi`. Its base query resolves mock responses keyed by endpoint URL, so it needs to be made
transport-only first — a holdout to migrate, not a pattern to follow.
