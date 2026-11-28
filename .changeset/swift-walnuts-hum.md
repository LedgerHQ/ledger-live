---
"@ledgerhq/coin-celo": minor
---

Report CELO as the native asset only in `getBalance`, `listOperations` and `getBlock`: GoldToken transfers become native operations, and its balance, which mirrors the native one, is left out. With these balances `validateIntent` finds none for a GoldToken transfer: send CELO as the native asset
