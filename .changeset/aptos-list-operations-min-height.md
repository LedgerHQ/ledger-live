---
"@ledgerhq/coin-aptos": minor
---

fix(coin-aptos): filter listOperations by block height instead of transaction version

`minHeight` was compared with transaction versions, so almost the whole history was returned. It is now mapped to the first transaction version of that block, inclusive.
