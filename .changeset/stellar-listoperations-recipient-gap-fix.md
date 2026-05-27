---
"@ledgerhq/coin-stellar": minor
---

Fix listOperations to no longer miss incoming Stellar operations that Horizon's `/accounts/{id}/operations` (and `/accounts/{id}/payments`) endpoints occasionally omit from their participants index. After paginating via `forAccount`, the result is now supplemented per-ledger from `/ledgers/{seq}/operations` (the same source `getBlock` uses) and any address-involving ops missed by the index are merged in.
