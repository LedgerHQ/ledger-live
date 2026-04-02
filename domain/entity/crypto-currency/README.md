# @domain/entity-crypto-currency

Zod-first canonical schema and static registry for the `CryptoCurrency` domain entity.

## Responsibility

- Define the **canonical data model** for crypto currencies (`CryptoCurrencySchema`)
- Provide a **static registry** of all known currencies (`CRYPTO_CURRENCIES_REGISTRY`), one file per currency under `src/currencies/`
- Provide **mock factories** for use in tests

No Redux slice, no selectors — the currency list is fully static. Consumers resolve currencies directly from the registry.

## Dependencies

| Package | Why |
|---|---|
| `@shared/schema-primitives` | `CurrencyIdSchema` branded value object |
| `@domain/entity-unit` | `UnitSchema` embedded value object |

## Public API

```typescript
// Schema + types (derived via z.infer)
import { CryptoCurrencySchema } from "@domain/entity-crypto-currency";
import type { CryptoCurrency, ExplorerView, EthereumLikeInfo, BitcoinLikeInfo } from "@domain/entity-crypto-currency";

// Registry
import { CRYPTO_CURRENCIES_REGISTRY, CRYPTO_CURRENCIES_IDS } from "@domain/entity-crypto-currency";
```

## File structure

```
src/
  define.ts               currency() helper — parses input through CryptoCurrencySchema
  schema.ts               CryptoCurrencySchema + inferred types
  registry.ts             CRYPTO_CURRENCIES_REGISTRY — keyed by currency id
                          CRYPTO_CURRENCIES_IDS — flat array of all known ids
  currencies/
    index.ts              export * from "./bitcoin"; export * from "./ethereum"; ...
    bitcoin.ts            export const bitcoin = currency({...})
    ethereum.ts
    ...                   one file per currency (200+)
scripts/
  generate-currencies.mts   codegen — run when the currency list changes
```

## Codegen

Currency files are generated and committed. To regenerate:

```sh
NODE_OPTIONS="--conditions=@ledgerhq/source" npx tsx scripts/generate-currencies.mts
```

## Design decisions

**Zod-first, not a wrapper.** `CryptoCurrencySchema` is written from scratch. TypeScript types are derived via `z.infer<>`.

**`currency()` is a branded-type constructor, not a validator.** `CryptoCurrency.id` is typed as `CurrencyId` — a branded string (`string & { __brand: "CurrencyId" }`). A plain type annotation (`const bitcoin: CryptoCurrency = { id: "bitcoin", ... }`) fails because `"bitcoin"` is not assignable to the branded type. `currency()` calls `CryptoCurrencySchema.parse()` which applies the brand, eliminating the need for `as CurrencyId` casts across all currency files.

**Static registry, no store.** Currency data never changes at runtime. Putting it in Redux would imply reactivity that doesn't exist — consumers resolve currencies directly from `CRYPTO_CURRENCIES_REGISTRY`.

**No embedded parent reference.** `TokenCurrency` (a sibling package) uses `parentCurrencyId: CurrencyId` (FK) instead of an embedded `CryptoCurrency` object, which eliminates the `fromTokenCurrencyRaw` lookup-at-restore problem that made `cal-client/persistence.ts` complex.
