---
"@ledgerhq/types-live": minor
"@ledgerhq/coin-evm": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Promote the EVM edit-transaction (speed-up / cancel) helpers to the bridge contract.

`AccountBridgeExtensions` is now generic over the transaction type and exposes the app-facing edit-transaction methods (`getEditTransactionPatch`, `getEditTransactionStatus`, `getFormattedFeeFields`, `hasMinimumFundsToCancel`, `hasMinimumFundsToSpeedUp`, `isStrategyDisabled`, `isTransactionConfirmed`). The implementations move out of `@ledgerhq/coin-evm` into `ledger-live-common` (`families/evm`), and every app/LLC call site now reaches them through `getAccountBridge(account)` instead of importing `@ledgerhq/coin-evm/editTransaction/*`. The contract uses only base types so other families (e.g. Bitcoin RBF) can implement the same surface later.
