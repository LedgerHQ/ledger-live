---
name: ddd-types-state-mocks
description: Structure a simple Ledger Wallet data layer where one API response maps to one entity slice. Use when creating or reviewing domain/entity schemas, inferred types, initial state, mocks, selectors, slices, domain/api clients, and their tests.
---

# DDD Types, State, And Mocks

Apply this pattern when one API resource maps to one entity slice. Use `ddd-data-layer-advanced` when one response hydrates several entities.

Source: [Types, Initial State & Mocks](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6102941793/Guideline+Monorepo+DDD+Re-architecture+Types+Initial+State+Mocks)

## Place Files

```text
domain/entity/<entity>/src/
├── schema.ts
├── schema.mock.ts
├── schema.test.ts
├── selectors.ts
├── selectors.test.ts
├── slice.ts
└── slice.test.ts

domain/api/<entity>/src/
├── api.ts
└── api.test.ts
```

Export only the contracts consumers need from each package `index.ts`.

## Keep Ownership Clear

| File             | Responsibility                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------ |
| `schema.ts`      | Define the runtime schema, infer the TypeScript type, and declare a complete initial state |
| `schema.mock.ts` | Build valid entity data with sensible defaults and optional overrides                      |
| `slice.ts`       | Own focused entity reducers and actions                                                    |
| `selectors.ts`   | Read or derive entity state without importing an app store type                            |
| `api.ts`         | Own transport contracts, network calls, and transformations                                |

Follow the package's runtime-schema precedent (Zod or Typia). Do not maintain a separate handwritten type that can drift from the schema.

## Validate The Contract

- Give every entity property an explicit initial value.
- Make every mock pass the runtime schema.
- Keep mock-only helpers out of production behavior.
- Give reducers one clear state transition each.
- Parse untrusted API data before storing it when the API layer does not already guarantee the contract.
- Register reducers and API middleware in each app composition root; never import an app store from a domain package.

## Test

- Schema: accept a mock, reject an invalid payload, and cover initial defaults.
- Mock: return valid data and honor supported overrides.
- Slice: cover initial state, replacement/reset, and focused updates.
- Selectors: cover direct and derived values with a minimal local state shape.
- API: cover success, relevant failures, and transformations with a local test store or existing domain test harness.
