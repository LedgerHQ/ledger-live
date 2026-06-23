---
"ledger-live-desktop": patch
---

Hide the legacy per-account/token star button on the account screen when Wallet 4.0 asset discoverability is enabled. The legacy star wrote to a separate store (`starredAccountIds`) that the W4.0 portfolio favourites (`starredMarketCoins`) never read, so favouriting a token there never showed in the portfolio. Users now favourite assets from the asset detail page, which correctly feeds the portfolio "Starred" banner.
