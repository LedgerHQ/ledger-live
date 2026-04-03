# @domain/entity-currency

Currency union types and single entry-point for all currency entity packages.

## Responsibility

- Export **`CryptoOrTokenCurrency`** — discriminated union of `CryptoCurrency | TokenCurrency`
- Export **`Currency`** — discriminated union of `CryptoCurrency | TokenCurrency | FiatCurrency`
- Re-export everything from the three currency entity packages and `@domain/entity-currency-unit`

This package owns no schemas of its own. It is a pure aggregation layer.

## Usage

```ts
// Union types
import { type Currency, type CryptoOrTokenCurrency } from "@domain/entity-currency";
import { CurrencySchema, CryptoOrTokenCurrencySchema } from "@domain/entity-currency";

// Everything from the sub-packages is also re-exported here
import {
  type CryptoCurrency, CRYPTO_CURRENCIES_REGISTRY,
  type TokenCurrency, token,
  type FiatCurrency, FIAT_CURRENCIES_REGISTRY,
  type Unit,
} from "@domain/entity-currency";
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

| Package | Re-exports |
|---|---|
| `@domain/entity-currency-unit` | `Unit`, `UnitSchema` |
| `@domain/entity-currency-crypto` | `CryptoCurrency`, `CRYPTO_CURRENCIES_REGISTRY`, `currency()`, … |
| `@domain/entity-currency-token` | `TokenCurrency`, `token()`, … |
| `@domain/entity-currency-fiat` | `FiatCurrency`, `FIAT_CURRENCIES_REGISTRY`, `fiat()`, … |

## Testing

```sh
pnpm test          # run tests
pnpm typecheck     # tsc --noEmit
```
