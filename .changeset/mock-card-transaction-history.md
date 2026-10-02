---
"@domain/api-card-management": minor
---

Serve a realistic Pay Card history to the apps' MSW workers.

- `mockPayCardTransactionsHistory()`: forty charges over six weeks, newest first, behind `./mock/card-transactions`.
- Dated relative to the moment it is read, so "Today" and "Yesterday" keep rendering.
- Covers every status, a refund, foreign-currency purchases and multi-wallet funding.
- Cashback covers all four states the provider sends — `EARNED`, `CLAIMED`, `PENDING` and `NOT_EARNED` — plus the declined charges that carry none, so each treatment is visible without a funded card.
- Forty charges six to a page make seven pages, the last short and the one after it empty, so scrolling reaches the end the way the provider ends it.
- `mockPayCardTransactions()` is unchanged — one per category, fixed, still what the other packages assert against.
