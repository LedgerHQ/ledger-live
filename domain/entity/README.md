# domain/entity/

Business domain entity packages. Each subdirectory is an independent pnpm workspace package containing Zod schemas, RTK slices, selectors, and tests for a single domain concept.

## Scope

`@domain/entity-<name>` (e.g. `@domain/entity-market`, `@domain/entity-crypto-assets`)

## Responsibility

- Define the **canonical data model** (Zod schemas + branded value objects)
- Own the **Redux slice** (`createSlice`) for the entity's state
- Export **selectors** for reading entity state
- Provide **mock factories** (`*.mock.ts`) for tests

## Conventions

- One entity per package
- Package name: `@domain/entity-<name>`
- Directory name: `domain/entity/<name>/`
- `package.json` must have `"private": true`
- `zod` and `@reduxjs/toolkit` as `peerDependencies`
- Barrel export via `src/index.ts` (default export = reducer when applicable)
- Mock and test files are not re-exported from the barrel

## File Structure

Each package follows this file layout inside `src/`:

```
schema.ts          # Zod schemas + branded value objects (required)
schema.test.ts     # Schema validation tests (required)
schema.mock.ts     # Mock factories for tests (required)
slice.ts           # RTK createSlice (optional)
slice.test.ts      # Slice reducer tests (required if slice exists)
slice.mock.ts      # Mock factories for tests (required if slice exists)
selectors.ts       # Selectors for reading state (optional)
selectors.test.ts  # Selector tests (required if selectors exist)
index.ts           # Barrel exports (required)
```

**The schema is always required** — it is the canonical data model and the primary reason the package exists.

**Slice, selectors, and actions are optional** because some entity packages are data-model-only. For example, an entity package may only define Zod schemas and value objects that are consumed by other packages.
