---
"@ledgerhq/live-e2e-shared": minor
"ledger-live-desktop-e2e-tests": minor
"ledger-live-mobile-e2e-tests": minor
---

Review buySell.spec (QAA-1107): pick the buy/sell provider from the available quotes via a shared deterministic weekly rotation helper (`pickRotatingProvider` in live-e2e-shared, used by both desktop and mobile) instead of hardcoded MoonPay, and expand sell coverage to BTC, ETH and USDT. Align the mobile BTC sell TMS link accordingly.
