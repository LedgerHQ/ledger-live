---
"@ledgerhq/coin-hedera": minor
---

fix bridge op-id collisions and subOperation parenting for packed CryptoTransfer txs. Fan-out legs now get unique discriminated ids; token ops sharing a hash with a value HBAR op use an anchored id hash; deserialization strips sub-ops from non-FEES/NONE coin ops.
