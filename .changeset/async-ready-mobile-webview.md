---
"live-mobile": minor
"@ledgerhq/live-common": minor
---

Prepare Web3AppWebview signing flows for async getAccountBridge. Widen UiHook return types for `transaction.sign` and `custom.acre.transactionSign` to `void | Promise<void>` so consumers can use async implementations safely.
