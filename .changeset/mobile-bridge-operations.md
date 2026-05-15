---
"live-mobile": patch
---

Migrate the mobile operations layer (OperationRow, OperationDetails, SendFunds recipient stuck-tx detection, account screen header) from deprecated isEditableOperation / isStuckOperation / getStuckAccountAndOperation top-level helpers to AccountBridgeExtensions via useAccountBridge / useAccountBridgeOrNull.
