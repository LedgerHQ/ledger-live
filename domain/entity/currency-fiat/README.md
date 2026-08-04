# @domain/entity-currency-fiat

> [!CAUTION]
> **Status: UNSTABLE** — Part of the emerging DDD layer; under active development.

Zod-first canonical schema and static registry for the `FiatCurrency` domain entity.

## Responsibility

- Define the **canonical data model** for fiat currencies (`FiatCurrencySchema`)
- Provide a **static registry** of all known fiat currencies (`FIAT_CURRENCIES_REGISTRY`), one file per currency under `src/currencies/`
- Provide **mock factories** for use in tests
- Expose a **`supportedFiatsSlice`** (RTK slice + `selectSupportedFiats` selector) that holds the runtime-supported fiat list populated by the CVS API, with an OFAC-filtered fallback

## Source of truth

This registry is the **sole** source of truth for fiat-currency data — add or edit a currency here. The
legacy entry carries no `id`; the domain `id` is the lower-cased ticker (e.g. `USD` → `usd`), and the
parity test compares on that.

## Dependencies

| Package | Why |
|---|---|
| `@shared/schema-primitives` | `FiatCurrencyIdSchema` branded value object |
| `@domain/entity-currency-unit` | `UnitSchema` embedded value object |
| `@reduxjs/toolkit` | `createSlice` for `supportedFiatsSlice` |

## Public API

```typescript
import { FiatCurrencySchema, type FiatCurrency } from "@domain/entity-currency-fiat";
import { FIAT_CURRENCIES_REGISTRY, FIAT_CURRENCIES_IDS } from "@domain/entity-currency-fiat";
import { fiat } from "@domain/entity-currency-fiat";
import {
  supportedFiatsSlice,
  setFiats,
  selectSupportedFiats,
  OFAC_FIAT_TICKERS,
  type SupportedFiatsState,
} from "@domain/entity-currency-fiat";
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
| `id`                  | `FiatCurrencyId`    | yes      | Unique opaque id (e.g. `"usd"`, `"eur"`)         |
| `name`                | `string`        | yes      | Human-readable name (e.g. `"US Dollar"`)         |
| `ticker`              | `string`        | yes      | ISO 4217 ticker (e.g. `"USD"`, `"EUR"`)          |
| `units`               | `Unit[]`        | yes      | Display units — at least one required            |
| `symbol`              | `string`        | no       | Currency symbol (e.g. `"$"`, `"€"`, `"£"`)      |
| `disableCountervalue` | `boolean`       | no       | Disable countervalue display when `true`         |
| `keywords`            | `string[]`      | no       | Search keywords (e.g. `["dollar", "usd"]`)       |

## Registry

`FIAT_CURRENCIES_REGISTRY` covers 163 fiat currencies. Each currency lives in its own file under
`src/currencies/` (named by its `id`, the lower-cased ticker) and is exported via
`src/currencies/index.ts`.

## File structure

```
src/
  define.ts       fiat() helper — parses input through FiatCurrencySchema
  schema.ts       FiatCurrencySchema + inferred FiatCurrency type
  schema.mock.ts  mockFiatCurrency() factory
  constants.ts    FIAT_CURRENCIES_REGISTRY, FIAT_CURRENCIES_IDS, FIAT_CURRENCIES_BY_TICKER
                  OFAC_FIAT_TICKERS, FALLBACK_FIAT_TICKERS
  types.ts        SupportedFiatsState
  utils.ts        getFiatCurrencyByTicker
  internals.ts    buildFallbackFiats (package-internal, not re-exported)
  slice.ts        supportedFiatsSlice, setFiats
  selector.ts     selectSupportedFiats
  currencies/
    index.ts      barrel export
    usd.ts  eur.ts  gbp.ts  ...   one file per currency (named by id)
```

## Testing

```sh
pnpm test          # run tests
pnpm typecheck     # tsc --noEmit
```

Mock factory:

```ts
import { mockFiatCurrency } from "@domain/entity-currency-fiat/schema.mock";

const eur = mockFiatCurrency({ id: "eur", name: "Euro", ticker: "EUR", symbol: "€" });
```
