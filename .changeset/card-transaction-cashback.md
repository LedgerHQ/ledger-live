---
"@domain/api-card-management": minor
---

Read the cashback a card transaction earned.

- `PayCardTransactionSchema` gains an optional `cashback`: the reward-token `amount`/`currency`, its `fiatAmount`/`fiatCurrency`, the `ratePercent` behind them, and a `status`.
- Amounts stay strings; `status` is one of `EARNED`, `CLAIMED`, `PENDING` or `NOT_EARNED`, and a cashback with any other status is dropped.
- Optional and caught, so a charge that earned nothing is still a transaction worth listing.
- The mocked page pairs every settled charge with a cashback and leaves the declined and reverted ones without one.
