---
"@ledgerhq/ledger-wallet-framework": minor
---

Expose `getCurrenciesResolver` and bound currency accessors (`getCryptoCurrencyById`, `findCryptoCurrencyById`, `findCryptoCurrencyByScheme`, `listCryptoCurrencies`, `hasCryptoCurrencyId`) from the `currencies` barrel, and broaden the framework currency types so coin-modules can consume them instead of `@ledgerhq/cryptoassets`/`@ledgerhq/types-cryptoassets`:

- `CryptoCurrency` gains `explorerId`/`tokenTypes`; `TokenCurrency` gains `symbol`/`keywords`; `ExplorerView` gains the `tx`/`address`/`token`/`stakePool` fields.
- New exported types `CryptoCurrencyId`, `LedgerExplorerId`, `FiatCurrency` and `Currency`.
