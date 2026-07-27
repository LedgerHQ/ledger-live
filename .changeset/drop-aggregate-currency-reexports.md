---
"@domain/entity-currency": minor
---

Remove the specialized re-exports from `@domain/entity-currency`; it now exposes only the cross-package unions (`Currency`/`CurrencySchema`, `CryptoOrTokenCurrency`/`CryptoOrTokenCurrencySchema`). Import specialized types (`CryptoCurrency`, `TokenCurrency`, `FiatCurrency`, `Unit`) directly from their own `@domain/entity-currency-*` package.
