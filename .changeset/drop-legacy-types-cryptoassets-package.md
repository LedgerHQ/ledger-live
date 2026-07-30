---
"@ledgerhq/types-live": minor
---

Own the currency type declarations locally instead of importing them from the now-deleted `@ledgerhq/types-cryptoassets`.

`@ledgerhq/types-live` was the last consumer of that package, which it pulled in as a `devDependency` even though the emitted `.d.ts` referenced it — so external consumers had to resolve a phantom dependency to type-check `Account.currency`. The declarations now live in `src/currency.ts` and are reachable as `@ledgerhq/types-live/currency`.

The exported type surface is unchanged: `CryptoCurrency`, `TokenCurrency`, `CryptoOrTokenCurrency` and `Unit` keep the exact shapes they had, so every signature that mentions them is structurally identical. `CoinType` is carried over as-is.

`FiatCurrency`, `Currency` and `CryptoCurrencyId` were not carried over — nothing in `types-live` used them. Import them from `@domain/entity-currency-fiat`, `@domain/entity-currency` and `@shared/schema-primitives` respectively.
