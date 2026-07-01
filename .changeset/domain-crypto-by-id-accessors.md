---
"@domain/entity-currency-crypto": minor
"@ledgerhq/cryptoassets": minor
---

Add by-id accessors to `@domain/entity-currency-crypto`: `getCryptoCurrencyById` (throws on miss), `findCryptoCurrencyById` (returns `undefined` on miss) and `hasCryptoCurrencyId`, resolving over the static `CRYPTO_CURRENCIES_REGISTRY` including the legacy alias keys. These let DA-layer and app consumers resolve currencies by id from the domain package directly, matching the legacy `@ledgerhq/cryptoassets` accessor semantics. Extended the domain parity test accordingly.
