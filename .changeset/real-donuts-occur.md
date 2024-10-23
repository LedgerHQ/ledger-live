---
"@ledgerhq/coin-evm": patch
"@ledgerhq/live-env": patch
---

Remove helper `applyEIP155` now that `hw-app-eth` is fixed and returns a valid `v` in all possible cases. Adding a env var `EVM_FORCE_LEGACY_TRANSACTIONS` to force transaction type 0, making this change QA compatible.
