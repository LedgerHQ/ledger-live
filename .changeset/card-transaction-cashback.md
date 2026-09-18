---
"@domain/api-card-management": minor
---

Read the cashback a card transaction earned.

- `PayCardTransactionSchema` gains an optional `cashback`: the reward-token `amount`/`currency`, its `fiatAmount`/`fiatCurrency`, the `ratePercent` behind them, and a `status`.
- Amounts stay strings; `status` is a plain string, not an enum, while the provider's values are being confirmed.
- Optional and caught, so a charge that earned nothing is still a transaction worth listing.
- The mocked page pairs every settled charge with a cashback and leaves the declined and reverted ones without one.
