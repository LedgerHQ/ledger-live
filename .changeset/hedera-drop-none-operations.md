---
"@ledgerhq/coin-hedera": patch
---

listOperations: drop zero-value `NONE` operations

`listOperations` emitted a `NONE` (value 0) operation for transactions where the account is neither a sender nor a recipient of any transfer (e.g. an HTS transfer between third parties for a token the account is merely associated with). These have no balance impact and are never surfaced by `getBlock`, which caused historical sync and block sync to produce different operation lists. They are now dropped to keep both paths consistent.
