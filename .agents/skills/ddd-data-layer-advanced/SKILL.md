---
name: ddd-data-layer-advanced
description: Structure a Ledger Wallet data layer where one API response serves several entities. Use when creating or reviewing cross-entity domain/api orchestration with RTK Query, createAsyncThunk, or both, including response validation and tests spanning multiple domain/entity packages.
---

# DDD Data Layer: Multiple Entities

Apply only when one API response maps to several autonomous entities. Use `ddd-types-state-mocks` for the rules inside each entity package.

Source: [Data Layer Advanced Use Case](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6112641121/Guideline+Monorepo+DDD+Re-architecture+Data+Layer+Advanced+Use+Case)

## Split Ownership

```text
domain/entity/<first>/src/schema.ts
domain/entity/<second>/src/schema.ts
domain/api/<orchestrator>/src/api.ts
```

- Let each entity own its schema and inferred type. Add state, selectors, mocks, and tests only when that entity needs them.
- Let one `domain/api` package own the cross-entity response contract, request, transformation, and validation.
- Keep UI and feature state in `features/flow`.
- Keep app composition out of the domain package.

## Process The Response

1. Fetch with RTK Query, `createAsyncThunk`, or both.
2. In the API layer, validate and transform each response collection with its owning entity schema.
3. Keep the result in RTK Query or dispatch the validated entities when slices must be hydrated.

Validate the collection before iterating over it: prefer `entitySchema.array().parse(value)` to `.map()` on untrusted data.

## Test The Orchestration

- Use entity mock builders when available; otherwise build schema-valid fixtures.
- Test RTK Query endpoints, thunks, or their integration according to the chosen orchestration.
- When reducers are involved, create a minimal local store or use an existing domain test harness.
- Never import an app store or app alias into a domain test.
- Assert the validated result, cache entry, and any hydrated slice that the orchestration owns.
- Cover transport failure, invalid collection shape, and invalid entity data when relevant.
