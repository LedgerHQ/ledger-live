---
"@ledgerhq/coin-kaspa": patch
---

Cap estimateMaxSpendable to the 88-UTXO-per-tx limit, fixing UtxoLimitReachedError on accounts with more than 88 UTXOs (LIVE-32902)
