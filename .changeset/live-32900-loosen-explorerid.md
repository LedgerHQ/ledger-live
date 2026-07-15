---
"@ledgerhq/types-cryptoassets": minor
"@domain/entity-currency-crypto": minor
---

Loosen `LedgerExplorerId` to `string` and mark `CryptoCurrency.explorerId` as `@deprecated` (kept only for backward compatibility; the explorer-id concept is being phased out). The domain crypto registry stays assignable to the legacy `CryptoCurrency` type, so it injects via `setCryptoCurrenciesStore` with no cast.
