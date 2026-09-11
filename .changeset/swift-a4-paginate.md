---
"@ledgerhq/live-common": patch
---

A4 pagination, ordering and incremental-sync continuity: drain all pages via `paginateOperations` with explicit `order:"DESC"` and `blocks=[minHeight,"latest"]` mapping.
