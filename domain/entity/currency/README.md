# @domain/entity-currency

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Cross-package currency **union types**. Specialized entity types live in their own packages.

## Responsibility

- Export **`CryptoOrTokenCurrency`** — discriminated union of `CryptoCurrency | TokenCurrency`
- Export **`Currency`** — discriminated union of `CryptoCurrency | TokenCurrency | FiatCurrency`

This package owns no schemas of its own and exposes **only** the cross-package unions. Import
specialized types (`CryptoCurrency`, `TokenCurrency`, `FiatCurrency`, `Unit`) directly from their
own `@domain/entity-currency-*` package — the aggregate does not re-export them.

## Usage

```ts
// Unions — from the aggregate
import { type Currency, type CryptoOrTokenCurrency } from "@domain/entity-currency";
import { CurrencySchema, CryptoOrTokenCurrencySchema } from "@domain/entity-currency";

// Specialized types — each from its own package
import { type CryptoCurrency, CRYPTO_CURRENCIES_REGISTRY } from "@domain/entity-currency-crypto";
import { type TokenCurrency, token } from "@domain/entity-currency-token";
import { type FiatCurrency, FIAT_CURRENCIES_REGISTRY } from "@domain/entity-currency-fiat";
import { type Unit } from "@domain/entity-currency-unit";
```

## Union types

```ts
// CryptoCurrency | TokenCurrency  — on-chain only
const CryptoOrTokenCurrencySchema = z.discriminatedUnion("type", [
  CryptoCurrencySchema,   // type: "CryptoCurrency"
  TokenCurrencySchema,    // type: "TokenCurrency"
]);

// CryptoCurrency | TokenCurrency | FiatCurrency  — any currency
const CurrencySchema = z.discriminatedUnion("type", [
  CryptoCurrencySchema,   // type: "CryptoCurrency"
  TokenCurrencySchema,    // type: "TokenCurrency"
  FiatCurrencySchema,     // type: "FiatCurrency"
]);
```

Use `CryptoOrTokenCurrency` when working with on-chain balances or addresses. Use `Currency` when displaying amounts to the user (countervalues, price tickers, account summaries).

## Dependencies

The unions are composed from the specialized entity schemas:

| Package | Union member |
|---|---|
| `@domain/entity-currency-crypto` | `CryptoCurrencySchema` |
| `@domain/entity-currency-token` | `TokenCurrencySchema` |
| `@domain/entity-currency-fiat` | `FiatCurrencySchema` |

## Testing

```sh
pnpm test          # run tests
pnpm typecheck     # tsc --noEmit
```
