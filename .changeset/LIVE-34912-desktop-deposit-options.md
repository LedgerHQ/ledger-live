---
"ledger-live-desktop": minor
"@features/flow-pay-card-deposit": minor
---

Wire the desktop Pay tab "Add stablecoin" tile to the shared Deposit options dialog: pressing it opens the dialog and each option routes to its desktop flow (bank transfer, swap, buy) or the receive asset flow filtered to stablecoins.

Render the deposit options as Lumen `ListItem` rows.
