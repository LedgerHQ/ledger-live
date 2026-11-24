---
"@ledgerhq/live-common": minor
---

Remove the legacy `marketApi` and its `market/state-manager` modules. Market data is now served by the `@domain/api-market-*` packages, injected into the shared Countervalues API.
