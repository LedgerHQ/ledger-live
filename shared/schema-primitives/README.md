# @shared/schema-primitives

Branded Zod value objects shared across the `domain/` layer. Provides common types so entity packages don't define them locally.

## Design constraints

- **No internal dependencies.** This package depends only on `zod`. It must never import from `@shared/*`, `@ledgerhq/*`, or `domain/*`. This keeps it safe to use in any package without creating circular dependencies.

## Exports

| Schema                  | Type              | Validates                                               |
| ----------------------- | ----------------- | ------------------------------------------------------- |
| `CurrencyIdSchema`      | `CurrencyId`      | Non-empty string                                        |
| `TokenIdSchema`         | `TokenId`         | Non-empty string                                        |
| `BigNumberStrSchema`    | `BigNumberStr`    | Decimal number string (e.g. `"123"`, `"-1.5"`)          |
| `NonEmptyStringSchema`  | `NonEmptyString`  | Trimmed string with length ≥ 1                          |
| `DateTimeIsoSchema`     | `DateTimeIso`     | RFC 3339 datetime with UTC offset (e.g. `"2024-01-31T12:00:00Z"`) |
| `HttpUrlSchema`         | `HttpUrl`         | Absolute `http://` or `https://` URL                    |
| `SemVerSchema`          | `SemVer`          | Semantic version (`1.2.3[-pre][+build]`)                |

All schemas are [Zod branded types](https://zod.dev/?id=brand), preventing accidental assignment between values that share the same underlying type.

## Usage

```ts
import {
  CurrencyIdSchema,
  DateTimeIsoSchema,
  type CurrencyId,
  type DateTimeIso,
} from "@shared/schema-primitives";

const AssetSchema = z.object({
  id: CurrencyIdSchema,
  lastSeen: DateTimeIsoSchema,
});

// Type-safe branded values
const id: CurrencyId = CurrencyIdSchema.parse("bitcoin");
const t: DateTimeIso = DateTimeIsoSchema.parse("2024-01-31T12:00:00Z");

// Compatible with both Date and Temporal
new Date(t);
Temporal.Instant.from(t);
```
