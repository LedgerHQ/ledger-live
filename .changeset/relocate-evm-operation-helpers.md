---
"@ledgerhq/coin-evm": patch
"@ledgerhq/live-common": patch
---

Relocate EVM operation helpers (`isEditableOperation`, `isStuckOperation`, `getStuckAccountAndOperation`) from `@ledgerhq/coin-evm/operation` to `families/evm/editTransaction/` in `ledger-live-common`
