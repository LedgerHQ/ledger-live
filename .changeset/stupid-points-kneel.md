---
"live-mobile": minor
---

fix(mobile): guard EVM AccountBalanceSummaryFooter against TokenAccount

Move the `account.type !== "Account"` early return before `account.currency.id`
is accessed in AccountBalanceFooter. TokenAccount objects have no `currency`
property, causing a crash ("Cannot read property 'id' of undefined") when
navigating to any EVM token account (e.g. USDT).
