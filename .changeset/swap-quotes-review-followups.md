---
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/wallet-cli": patch
---

Address the review findings raised on the swap `fetchQuotes` RTK Query migration (#18764).

**API change.** `GetQuotesContext` now requires a `dispatch`, which replaces the `globalThis` dispatch singleton. `setSwapQuotesStore` / `getSwapQuotesDispatch` / `resetSwapQuotesStore` are gone, and `setupStandaloneSwapQuotesStore` no longer registers anything globally — it returns the store, and the caller threads `store.dispatch` into the context it already builds. Every caller of `getQuotes` already constructs a `GetQuotesContext`, so a host that registers the reducer but forgets the dispatch is now a compile error instead of a throw on the first quote request.

**Behaviour fixes.**

- Two concurrent `/quote` requests differing only by `headers` no longer share one in-flight call. RTK Query dedupes on cache key before `forceRefetch` is consulted, so the second caller previously received a body fetched with the first caller's headers. The cache key now includes a digest of the headers, which keeps a live-app token out of redux state while still separating callers.
- An aggregator HTTP error is logged again as `network-error`. It still resolves to an empty result, which the caller surfaces as "no quotes", so this log is the only signal that the request failed at all — the axios interceptor emitted it before the migration.
- Desktop's redux logger no longer records `customHeaders` or swap send/receive addresses into the exportable support log.
