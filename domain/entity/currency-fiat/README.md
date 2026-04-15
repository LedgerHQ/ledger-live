# @domain/entity-currency-fiat

Zod-first canonical schema and static registry for the `FiatCurrency` domain entity.

## Responsibility

- Define the **canonical data model** for fiat currencies (`FiatCurrencySchema`)
- Provide a **static registry** of major world currencies (`FIAT_CURRENCIES_REGISTRY`), one file per currency under `src/currencies/`
- Provide **mock factories** for use in tests

No Redux slice, no selectors — the registry is fully static.

## Dependencies

| Package | Why |
|---|---|
| `@shared/schema-primitives` | `CurrencyIdSchema` branded value object |
| `@domain/entity-currency-unit` | `UnitSchema` embedded value object |

## Public API

```typescript
import { FiatCurrencySchema, type FiatCurrency } from "@domain/entity-currency-fiat";
import { FIAT_CURRENCIES_REGISTRY, FIAT_CURRENCIES_IDS } from "@domain/entity-currency-fiat";
import { fiat } from "@domain/entity-currency-fiat";
```

For the full currency union (`CryptoCurrency | TokenCurrency | FiatCurrency`) use `@domain/entity-currency`.

## Usage

```ts
import { fiat } from "@domain/entity-currency-fiat";

const usd = fiat({
  type: "FiatCurrency",
  id: "usd",
  name: "US Dollar",
  ticker: "USD",
  symbol: "$",
  units: [{ name: "US Dollar", code: "USD", magnitude: 2 }],
});
```

## Schema

| Field                 | Type            | Required | Description                                      |
| --------------------- | --------------- | -------- | ------------------------------------------------ |
| `type`                | `"FiatCurrency"` | yes     | Discriminant literal                             |
| `id`                  | `CurrencyId`    | yes      | Unique opaque id (e.g. `"usd"`, `"eur"`)         |
| `name`                | `string`        | yes      | Human-readable name (e.g. `"US Dollar"`)         |
| `ticker`              | `string`        | yes      | ISO 4217 ticker (e.g. `"USD"`, `"EUR"`)          |
| `units`               | `Unit[]`        | yes      | Display units — at least one required            |
| `symbol`              | `string`        | no       | Currency symbol (e.g. `"$"`, `"€"`, `"£"`)      |
| `disableCountervalue` | `boolean`       | no       | Disable countervalue display when `true`         |
| `keywords`            | `string[]`      | no       | Search keywords (e.g. `["dollar", "usd"]`)       |

## Registry

`FIAT_CURRENCIES_REGISTRY` covers 20 major world currencies:

USD, EUR, GBP, JPY, CHF, AUD, CAD, SGD, HKD, KRW, BRL, MXN, INR, CNY, SEK, NOK, DKK, NZD, ZAR, RUB.

Each currency lives in its own file under `src/currencies/` and is exported via `src/currencies/index.ts`.

## File structure

```
src/
  define.ts               fiat() helper — parses input through FiatCurrencySchema
  schema.ts               FiatCurrencySchema + inferred FiatCurrency type
  schema.mock.ts          mockFiatCurrency() factory
  registry.ts             FIAT_CURRENCIES_REGISTRY — keyed by currency id
                          FIAT_CURRENCIES_IDS — flat array of all known ids
  currencies/
    index.ts              barrel export
    usd.ts  eur.ts  gbp.ts  ...
```

## Testing

```sh
pnpm test          # run tests
pnpm typecheck     # tsc --noEmit
```

Mock factory:

```ts
import { mockFiatCurrency } from "@domain/entity-currency-fiat/src/schema.mock";

const eur = mockFiatCurrency({ id: "eur", name: "Euro", ticker: "EUR", symbol: "€" });
```
