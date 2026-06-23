# @domain/entity-currency-fiat

Zod-first canonical schema and static registry for the `FiatCurrency` domain entity.

## Responsibility

- Define the **canonical data model** for fiat currencies (`FiatCurrencySchema`)
- Provide a **static registry** of all known fiat currencies (`FIAT_CURRENCIES_REGISTRY`), one file per currency under `src/currencies/`
- Provide **mock factories** for use in tests

No Redux slice, no selectors — the registry is fully static.

## Source of truth & dual maintenance

This registry is the **primary** source of truth for fiat-currency data. During the migration off
`@ledgerhq/cryptoassets`, the legacy registry (`libs/ledgerjs/packages/cryptoassets/src/fiats.ts`) still
ships to external consumers, so the two are **dual-maintained**: when you add or edit a currency, update
**both** this registry and the legacy `byTicker` map until legacy is dropped.

A CI parity test — `libs/ledgerjs/packages/cryptoassets/src/fiats.domain-parity.test.ts` — fails if the
two diverge (a missing/extra currency, or any changed field), so neither can drift unnoticed. After
changing legacy you can re-sync this registry by re-running the generator (see [Codegen](#codegen)). The
legacy entry carries no `id`; the domain `id` is the lower-cased ticker (e.g. `USD` → `usd`), and the
parity test compares on that.

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

`FIAT_CURRENCIES_REGISTRY` is seeded to parity with the legacy `@ledgerhq/cryptoassets` fiat list and
covers every fiat ticker it ships (163 currencies). Each currency lives in its own file under
`src/currencies/` (named by its `id`, the lower-cased ticker) and is exported via
`src/currencies/index.ts`.

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
    usd.ts  eur.ts  gbp.ts  ...   one file per currency (named by id)
scripts/
  generate-currencies.mts   codegen — run when the legacy fiat list changes
```

## Codegen

Currency files are generated from the legacy fiat list and committed. To regenerate:

```sh
NODE_OPTIONS="--conditions=@ledgerhq/source" npx tsx scripts/generate-currencies.mts
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
