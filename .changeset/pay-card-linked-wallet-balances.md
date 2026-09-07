---
"@features/flow-pay-card-wallets": minor
---

New package joining the card's funding wallets to their balances:

- `combineCardLinkedWallets` — joins the two wallet endpoints on `id`, orders by Baanx's charging priority, and totals the counter-values.
- `useCardLinkedWallets` — runs both reads in parallel and memoizes the join.
- The counter-value conversion is an injected port, so resolving Baanx's `currency`/`network` onto a Ledger currency stays in the app.
- `isPartialTotal` flags a total that is understating, because a balance or a rate was missing.
