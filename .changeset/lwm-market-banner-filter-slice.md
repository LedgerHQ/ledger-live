---
"live-mobile": minor
---

Add a persisted `marketBanner` Redux slice holding the market banner ranking (`ranking`), mirroring ledger-live-desktop. Exposes `setMarketBannerRanking` and `selectMarketBannerRanking`, defaults to `"trending"`, and survives app restart via MMKV.
