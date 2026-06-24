---
"@ledgerhq/live-common": minor
"@ledgerhq/asset-detail": minor
"live-mobile": minor
"ledger-live-desktop": minor
---

Support token market deeplinks (e.g. `ledgerlive://market/WLFI`) on the Wallet 4.0 Asset Detail path. When a deeplink segment isn't a known coin id, it is resolved via the market search API (matching by ticker/name/slug) so any ledger-backed token opens the detail screen with its price and chart.
