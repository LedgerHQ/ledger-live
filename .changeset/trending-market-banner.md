---
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

feat(market-banner): back the "Trending" ranking with the countervalues `/v3/currencies/trending` endpoint

The market banner "Trending" filter (desktop and mobile) now fetches the dedicated trending
currencies list (hydrated via `/v3/markets`, preserving trending order and keeping only supported
entries) instead of reusing the gainers performers query. Adds a `getTrendingPerformers` endpoint
and `useTrendingPerformers` hook in live-common.
