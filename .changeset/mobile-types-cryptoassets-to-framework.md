---
"@ledgerhq/ledger-wallet-framework": minor
"live-mobile": minor
---

Repoint all `ledger-live-mobile` currency type imports off `@ledgerhq/types-cryptoassets` onto
`@domain/entity-currency-*` packages (private consumer → branded domain types):
- Specialized types from their own package: `CryptoCurrency` ← `@domain/entity-currency-crypto`,
  `TokenCurrency` ← `@domain/entity-currency-token`, `FiatCurrency` ← `@domain/entity-currency-fiat`,
  `Unit` ← `@domain/entity-currency-unit`
- Unions (`CryptoOrTokenCurrency`, `Currency`) from `@domain/entity-currency`
- Removes `@ledgerhq/types-cryptoassets` dependency from `live-mobile`
- Adds `@domain/entity-currency-token` and `@domain/entity-currency-unit` dependencies to `live-mobile`

Framework: adds `CryptoOrTokenCurrency = CryptoCurrency | TokenCurrency` union type and explicit `./types`
subpath export for public-lib consumers.
