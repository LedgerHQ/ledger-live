---
"@features/flow-pay-card-transactions": minor
"@domain/api-card-management": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Read the card transactions and give each one its spend category.

- `useCardTransactionsViewModel` reads the first page of `GET /v1/card/transactions` while a session is live, and hands each transaction its category and that category's translated label.
- `mccCategory` is now the closed set the provider documents (`PayCardTransactionCategory`), and a grouping it never named reads as `MISC` so one new label cannot fail a whole page.
- `mockPayCardTransactions` answers a page covering every category, served by the desktop and mobile MSW workers on `GET /v1/card/transactions`.
