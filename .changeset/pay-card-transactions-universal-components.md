---
"@features/flow-pay-card-transactions": minor
"@features/flow-pay-card-assets": minor
"@features/flow-pay-card-details": minor
---

Make the card transaction components universal: `CardTransactions` takes `onOpenTransaction` and `ListItem` takes `onOpenTransaction`, `CardTransactionDetail` is the detail content on both platforms, and the web dialog moves to `CardTransactionDetailDialog` in the `./web` entry. `CategoryIcon` is no longer exported.
