---
"ledger-live-desktop": patch
"@ledgerhq/live-currency-format": patch
---

Fix: LWD PnL detail modal now prefixes positive values with `+` (and negatives with `-`), matching Ledger Live Mobile. `formatPrice` gains an optional `alwaysShowSign` option that is forwarded to `formatCurrencyUnit`.
