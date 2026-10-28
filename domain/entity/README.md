# domain/entity/

> Part of the [monorepo architecture](../../docs/monorepo-architecture.md).

Business domain entity packages. Each subdirectory is an independent pnpm workspace package containing Zod schemas, RTK slices, selectors, and tests for a single domain concept.

## Responsibility

- Define the **canonical data model** (Zod schemas + branded value objects)
- Own the **Redux slice** (`createSlice`) for the entity's state
- Export **selectors** for reading entity state
- Provide **mock factories** (`*.mock.ts`) for tests

## Conventions

For the standard package checklist (private flag, tsconfig, naming…) see [docs/new-library.md](../../docs/new-library.md).

Entity-specific:
- One entity per package — `domain/entity/<name>/`
- Use `zod` for schema definition, `@reduxjs/toolkit` for the slice
- Barrel export via `src/index.ts`, `export *` only, plus `export { default } from "./slice"` for a package with a slice (see [package-public-api](../../.agents/skills/package-public-api/SKILL.md))
- With a slice, `slice.ts` exports its complete initial state and `export default <name>Slice.reducer`
- No React: RTK Query hooks belong to `domain/api`, UI to `features/`
- Mock and test files are not re-exported from the barrel; mocks are `package.json#exports` subpaths (`./schema.mock`, `./slice.mock`)

Schemas, slices, mocks and selectors in detail: the [`domain-data`](../../.agents/skills/domain-data/SKILL.md) skill.

## File Structure

Each package follows this file layout inside `src/`:

```
actions.ts         # Actions for mutating state (optional)
actions.test.ts    # Actions tests (required if actions exist)
schema.ts          # Zod schemas + branded value objects (required)
schema.test.ts     # Schema validation tests (required)
schema.mock.ts     # Schema-valid mock factories with overrides (required)
slice.ts           # RTK createSlice, initial state, default-exported reducer (optional)
slice.test.ts      # Slice reducer tests (required if slice exists)
slice.mock.ts      # Mock slice state built from schema mocks (required if slice exists)
selectors.ts       # Selectors for reading state (optional)
selectors.test.ts  # Selector tests (required if selectors exist)
index.ts           # Barrel exports (required)
```

**The schema is always required** — it is the canonical data model and the primary reason the package exists.

**Slice, selectors, and actions are optional** because some entity packages are data-model-only. For example, an entity package may only define Zod schemas and value objects that are consumed by other packages.
