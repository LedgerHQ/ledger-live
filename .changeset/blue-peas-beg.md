---
"@ledgerhq/coin-casper": minor
---

Implement `validateIntent` for the Casper coin module and wire it into `createApi`, porting the `bridge/getTransactionStatus` rules to the Alpaca surface. The legacy bridge is unchanged and stays live as the rollback path, so the tests assert rule parity between the two.
