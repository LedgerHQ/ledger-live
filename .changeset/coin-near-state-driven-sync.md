---
"@ledgerhq/coin-near": minor
---

Sync NEAR accounts from the account state on the node: read the nearblocks history and staking deposits only when the account changed, keep the stored operations and pools when nearblocks fails, and allow turning this off through the coin config
