---
"@ledgerhq/coin-cosmos": patch
"@ledgerhq/live-signer-cosmos": patch
---

fix(cosmos): add the gonka chain and always send the HRP to the signer

Adds the Gonka chain to the Cosmos coin module's chain factory. Fixes the Cosmos
signer to send the chain's address prefix to the device on every coin type
instead of only coin type 60 — the gate was safe while 118 was the only other
option, but a chain on any other coin type (Gonka is on 1200) could not sign
through the DMK signer. Renames `CosmosSigner.sign`'s third parameter from
`transactionType` to `hrp`, matching what it actually carries. Also treats a
zero fee as loaded rather than missing on the send path, so a zero-fee chain
can send a transaction and use its full spendable balance.
