---
"ledger-live-desktop": patch
---

Fix Q2 analytics tracking on transaction history, history export dialog, and MyWallet context menu. Renames `entry` to `button` for consistency, stabilises the `OperationList` page event so it is not re-emitted on operation count changes, adds the missing success page and `button_clicked` events around CSV export, and reads the source page from the route ref so MyWallet's `page` property is reliable when opening the context menu.
