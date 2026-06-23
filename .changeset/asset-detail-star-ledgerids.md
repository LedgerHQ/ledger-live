---
"@ledgerhq/live-common": minor
"@ledgerhq/asset-detail": minor
"@ledgerhq/asset-aggregation": minor
"live-mobile": minor
"ledger-live-desktop": minor
---

Fix Asset Detail favourites for tokens opened from Market or Assets by resolving market data via the /v3/markets `ledgerIds` filter while keeping backward compatibility with the legacy `ids` filter.
