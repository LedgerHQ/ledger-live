---
"@ledgerhq/coin-hedera": patch
---

Nest Hedera extras under `familyExtra` in `getBlock`, as `listOperations` already does, so a transaction gets the same details from both paths
