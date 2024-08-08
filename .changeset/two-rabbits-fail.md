---
"@ledgerhq/coin-evm": patch
---

Remove `NotEnoughBalanceInParentAccount` error from `validateAmount` check in `getTransactionStatus` as it was redundant with a `validateGas` test
