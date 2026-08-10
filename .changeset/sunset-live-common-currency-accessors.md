---
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/wallet-cli": minor
"@ledgerhq/web-tools": minor
"@ledgerhq/asset-detail": minor
"@ledgerhq/live-e2e-shared": minor
"ledger-live-mobile-e2e-tests": minor
---

Import currency accessors from the domain layer instead of the `@ledgerhq/live-common/currencies` barrel.

Crypto accessors (`getCryptoCurrencyById`, `findCryptoCurrencyById`, `findCryptoCurrencyByKeyword`, `findCryptoCurrencyByTicker`, `listCryptoCurrencies`, `findCryptoCurrency`, `findCryptoCurrencyByScheme`, `hasCryptoCurrencyId`) now come from `@domain/entity-currency-crypto`, and fiat accessors (`getFiatCurrencyByTicker`, `findFiatCurrencyByTicker`, `listFiatCurrencies`, `hasFiatCurrencyTicker`) from `@domain/entity-currency-fiat`. The re-exports that forwarded them through `@ledgerhq/live-common/currencies` are removed; the barrel keeps its formatting, colour, helper, marketcap, support and URI-scheme exports. Behaviour is unchanged — the barrel already delegated to these same domain functions.
