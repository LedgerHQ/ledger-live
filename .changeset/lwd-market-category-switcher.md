---
"ledger-live-desktop": minor
"@ledgerhq/live-common": minor
"live-mobile": patch
---

LWD - W4.0 - Add the Market category switcher (All / Stocks / Favorites) on the V4 Market page, gated by the `lwdWallet40.assetDiscoverability` feature flag. The selected category is persisted across reloads and supersedes the legacy starred filter drawer when the flag is on. The shared category helpers (`parseMarketListCategory`, `getMarketFilter`, `isStockMarketCurrency`) now live in `@ledgerhq/live-common/market/utils/category` and are reused by both desktop and mobile.
