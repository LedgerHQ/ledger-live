---
"@ledgerhq/coin-evm": patch
---

Update `getTransactionStatus` to take `customGasLimit` into account instead of `gasLimit` when testing the value being zero or under the minimum expected
