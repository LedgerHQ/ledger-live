---
"@ledgerhq/coin-tron": minor
---

Report the TRX and TRC10 that contracts move during a transaction (internal transactions): `getBlock` lists them for every successful transaction, and `listOperations` lists those of the contract calls in the account's history as `IN`/`OUT` operations with no fee and `details.internal: true`
