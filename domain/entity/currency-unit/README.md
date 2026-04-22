# @domain/entity-currency-unit

Zod-first schema for the `Unit` value object.

A `Unit` represents a denomination of a currency (e.g. BTC, mBTC, satoshi). It is a **value object** —
embedded inside currency entities and never stored independently.

## Usage

```ts
import { UnitSchema, type Unit } from "@domain/entity-currency-unit";

const unit: Unit = UnitSchema.parse({
  name: "Bitcoin",
  code: "BTC",
  magnitude: 8,
});
```

## Schema

| Field           | Type      | Required | Description                                          |
| --------------- | --------- | -------- | ---------------------------------------------------- |
| `name`          | `string`  | yes      | Human-readable name (e.g. `"Bitcoin"`)               |
| `code`          | `string`  | yes      | Ticker symbol (e.g. `"BTC"`)                         |
| `magnitude`     | `number`  | yes      | Decimal places from base unit — non-negative integer |
| `showAllDigits` | `boolean` | no       | Always show trailing zeros up to `magnitude` digits  |
| `prefixCode`    | `boolean` | no       | Render `code` before the amount instead of after     |

## Testing

```sh
pnpm test          # run tests
pnpm typecheck     # tsc --noEmit
```

Mock factory available in `src/schema.mock.ts`:

```ts
import { mockUnit } from "@domain/entity-currency-unit/src/schema.mock";

// override individual fields
const unit = mockUnit({ magnitude: 0 });
```
