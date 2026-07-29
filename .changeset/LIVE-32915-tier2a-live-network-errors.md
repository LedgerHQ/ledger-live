---
"@ledgerhq/live-network": major
---

Define `LedgerAPI4xx`, `LedgerAPI5xx`, and `NetworkDown` as native error classes in `@ledgerhq/live-network` instead of importing them from `@ledgerhq/errors`. All three are now exported from the package's public index for downstream migrations.
