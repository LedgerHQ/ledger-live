---
"@ledgerhq/coin-hedera": patch
---

Expose the Ledger operation type (`CONTRACT_CALL`, `UPDATE_ACCOUNT`) in `getBlock` transaction details as `ledgerOpType`, as `listOperations` does (BACK-11822).
