---
"@ledgerhq/coin-bitcoin": minor
---

Compute the BTC dust threshold from the node's min relay fee (Bitcoin Core model: 3 × input vBytes × relay fee rate), floored at the legacy threshold. Altcoins and missing-relay-fee cases keep the previous size-only behavior.
