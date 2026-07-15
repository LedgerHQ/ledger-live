---
"@domain/entity-currency-crypto": minor
---

Add list and search accessors to `@domain/entity-currency-crypto`: `listCryptoCurrencies`, `findCryptoCurrency`, `findCryptoCurrencyByScheme`, `findCryptoCurrencyByTicker`, and `findCryptoCurrencyByKeyword`. These match the legacy `@ledgerhq/cryptoassets` accessor semantics (including the keyword-tiebreak ticker disambiguation) and are built once at module load over the static `CRYPTO_CURRENCIES_REGISTRY`.
