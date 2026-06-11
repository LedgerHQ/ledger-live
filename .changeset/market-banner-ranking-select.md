---
"ledger-live-desktop": minor
---

Add a ranking selector (Trending, Gainers, Losers, Favorites) to the MarketBanner header, gated behind the `assetDiscoverability` feature flag. The selection is persisted across reloads via a new `marketBanner` Redux slice. Favorites is disabled when no market coins are starred.
