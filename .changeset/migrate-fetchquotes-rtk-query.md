---
"@ledgerhq/live-common": patch
"ledger-live-desktop": patch
"live-mobile": patch
"@ledgerhq/wallet-cli": patch
---

Migrate the swap `fetchQuotes` helper from axios to an RTK Query endpoint (`swapQuotesApi`). The aggregator `/quote` request now flows through the Redux data layer, and the rawQuotes/providerErrors split is unchanged. Desktop and mobile register the new API and inject their store dispatch at startup via `setSwapQuotesStore`; wallet-cli, which has no app store, sets up a standalone one.

Two behaviour changes to be aware of:

- `/quote` now goes through the authenticated base query, where the legacy axios call sent no credentials. No request carries an `Authorization` header yet: no app registers `authSDK` on its store's `extra`, so the adapter falls back to an unauthenticated request. Once that wiring lands, `/quote` will carry the header and 401/403 will trigger the adapter's refresh-and-retry.
- An aggregator HTTP error (4xx/5xx) now resolves to an empty result, so the caller surfaces the `noQuotes` global. Previously the shared axios error interceptor turned these into `LedgerAPI4xx`/`LedgerAPI5xx`, which propagated to the live app as an error. Only transport failures (no HTTP response) still reject.
