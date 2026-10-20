---
"@ledgerhq/coin-concordium": minor
---

Concordium API listOperations: set tx.feesPayer to the transaction sender, matching getBlock. tx.fees stays the fee the listed account paid, so it is 0 on a row another account paid for.
