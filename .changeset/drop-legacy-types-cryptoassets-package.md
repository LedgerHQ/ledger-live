---
"@ledgerhq/types-live": minor
---

Own the currency type declarations internally instead of importing them from the now-deleted `@ledgerhq/types-cryptoassets`.

`@ledgerhq/types-live` was the last consumer of that package, which it pulled in as a `devDependency` even though the emitted `.d.ts` referenced it — so external consumers had to resolve a phantom dependency to type-check `Account.currency`. The declarations now live in `src/currency.ts`.

These types are internal: they are not re-exported from the package entry point, and the `./currency` subpath is blocked in `exports`, so they cannot be imported from outside. They are marked `@deprecated` and exist only until the types that carry them move to the domain packages. Use `@domain/entity-currency-crypto`, `@domain/entity-currency-token`, `@domain/entity-currency-unit` and `@domain/entity-currency`.

The exported type surface is unchanged: `CryptoCurrency`, `TokenCurrency`, `CryptoOrTokenCurrency` and `Unit` keep the exact shapes they had, so every signature that mentions them is structurally identical.

`FiatCurrency`, `Currency` and `CryptoCurrencyId` were not carried over — nothing in `types-live` used them. Import them from `@domain/entity-currency-fiat`, `@domain/entity-currency` and `@shared/schema-primitives` respectively.
