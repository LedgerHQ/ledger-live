---
"@ledgerhq/live-common": patch
"ledger-live-desktop": patch
---

Fix Market list sorting bleeding across category tabs on desktop: reset sort to default when switching tabs, reset pagination when sort or filters change, and keep paginated market data ordered by page when combining results.
