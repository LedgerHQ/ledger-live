---
"@ledgerhq/live-common": patch
"ledger-live-desktop": patch
---

Add a "Total volume" sort option to the desktop Market table. The Volume column header is now sortable and toggles between highest and lowest 24h volume, mapping to the new `total-volume-desc` and `total-volume` values of the `/v3/markets` `sort` parameter.
