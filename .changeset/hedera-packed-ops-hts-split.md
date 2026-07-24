---
"@ledgerhq/coin-hedera": minor
---

fix(hedera): parse multi-asset CryptoTransfers into one op per fund movement (HBAR on the main account, one per token on its sub-account) instead of a synthetic FEES operation. Operation ids change, so already-synced accounts may need a resync or cache clear.
