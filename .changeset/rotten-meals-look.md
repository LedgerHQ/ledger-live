---
"@ledgerhq/coin-aptos": minor
---

Fix Aptos transactions wrongly reporting a GasInsufficientBalance error after using "Use max". Gas estimation now always simulates against the default gas options instead of reusing a stale maxGasAmount/gasUnitPrice computed for a previous transaction.
