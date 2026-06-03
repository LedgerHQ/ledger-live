---
"live-mobile": minor
---

Fix transaction-history analytics: the top-bar transaction-history icon now emits a `button_clicked` event with `button: "operation_list"`, and the `Page OperationList` screen event now reports the missing `has_pending_operations` property. For consistency, all top-bar entries (My Ledger, My Wallet, Discover, Notifications, Settings, transaction history) now emit `button_clicked` instead of `menuentry_clicked`.
