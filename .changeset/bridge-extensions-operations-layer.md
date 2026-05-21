---
"ledger-live-desktop": patch
---

Migrate desktop operations layer (operations list, operation details drawer, edit-stuck-transaction panels for BTC and EVM, send recipient stuck-tx detection, account header actions) from deprecated isEditableOperation / isStuckOperation / getStuckAccountAndOperation top-level helpers to AccountBridgeExtensions via useAccountBridge / getAccountBridge.
