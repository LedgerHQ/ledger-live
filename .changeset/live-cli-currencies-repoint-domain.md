---
"@ledgerhq/live-cli": minor
---

Repoint currency accessor imports off the `@ledgerhq/live-common/currencies` barrel onto `@domain/entity-currency-crypto` directly. `findCryptoCurrencyByKeyword`, `findCryptoCurrencyById`, and `getCryptoCurrencyById` are now sourced from the domain entity package. Runtime behaviour is unchanged.
