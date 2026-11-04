---
"@domain/entity-currency-fiat": minor
"@domain/entity-account-operation": minor
"@domain/api-market-countervalues": minor
"@features/flow-account-analytics": minor
"@devtools/mock-accounts": minor
"@devtools/bindings": minor
---

Brand the fiat currency ticker as `FiatCurrencyTicker` (three uppercase letters) in `@domain/entity-currency-fiat` and use it for operation countervalues and the analytics fiat, replacing `CountervalueTicker` and the unused `FiatCurrencyId`.
