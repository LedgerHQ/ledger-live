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
- Barrel export via `src/index.ts` (default export = reducer)
- Mock files are not re-exported from the barrel
