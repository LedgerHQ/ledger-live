---
"@ledgerhq/coin-tron": minor
---

Guard sponsored (Tronify) USDT sends against the "fee consumed, transfer fails" loss (LIVE-32777). When a send carries `energyProviderInfo`, `getTransactionStatus` now reserves the USDT rental fee — a live Tronify quote priced from the transfer's energy requirement — out of the token balance: it blocks with `NotEnoughBalance` when the USDT balance can't cover fee + amount, and a max send leaves the fee behind (`amount = balance − fee`, `totalSpent = balance`). `estimateMaxSpendable` mirrors the reservation so "Max" doesn't overshoot. The guard is inert for non-sponsored sends and degrades to no reservation when the quote is unavailable or the rent is priced in a different asset (the TRX-paid flow).
