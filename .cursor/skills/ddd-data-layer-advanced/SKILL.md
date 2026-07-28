---
name: ddd-data-layer-advanced
description: Structure a Ledger Wallet data layer where one API response hydrates several entity slices. Use when creating or reviewing cross-entity domain/api orchestration, response validation, dispatching, and tests spanning multiple domain/entity packages.
---

# DDD Data Layer: Multiple Entities

Apply only when one API response maps to several autonomous entities. Use `ddd-types-state-mocks` for the rules inside each entity package.

Source: [Data Layer Advanced Use Case](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6112641121/Guideline+Monorepo+DDD+Re-architecture+Data+Layer+Advanced+Use+Case)

## Split Ownership

```text
domain/entity/<first>/src/data/
├── schema.ts
├── schema.mock.ts
└── slice.ts

domain/entity/<second>/src/data/
├── schema.ts
├── schema.mock.ts
└── slice.ts

domain/api/<orchestrator>/src/
├── <orchestrator>.thunk.ts
└── <orchestrator>.thunk.test.ts
```

- Let each entity own its schema, type, initial state, mocks, selectors, slice, and tests.
- Let one `domain/api` package own the cross-entity response contract, request, transformation, validation, and dispatch sequence.
- Keep UI and feature state in `features/flow`.
- Register entity reducers in each app; do not move orchestration into an app.

## Process The Response

1. Fetch the response in the orchestrating API package.
2. Reject transport failures before reading the payload.
3. Validate every response branch as a collection with its owning entity schema.
4. Transform data only in the API layer.
5. Dispatch already validated entities to their respective slices.
6. Return a useful typed result when callers need completion or error state.

Validate the collection shape itself, not only each item. With Zod, prefer `entitySchema.array().parse(value)` over calling `.map()` on untrusted data.

## Test The Orchestration

- Build payloads with each entity's mock builder.
- Create a minimal local store with the involved reducers, or use an existing domain test harness.
- Never import an app store or app alias into a domain test.
- Assert the returned result and every hydrated slice.
- Cover transport failure, invalid collection shape, and invalid entity data when relevant.
