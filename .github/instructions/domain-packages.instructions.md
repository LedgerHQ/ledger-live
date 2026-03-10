---
applyTo: "domain/**"
---

# Domain Package Conventions

When reviewing changes under `domain/`, enforce the following rules.

## Directory Structure

- Entity packages: `domain/entity/<name>/`
- API packages: `domain/api/<name>/`
- No other top-level subdirectories are allowed under `domain/` besides `entity/` and `api/`.

## Package Naming

- Entity packages: `@domain/entity-<name>` (e.g. `@domain/entity-market`)
- API packages: `@domain/api-<name>` (e.g. `@domain/api-market`)
- Packages must **not** use the `@ledgerhq/` scope — these are internal-only packages.

## `package.json` Requirements

Every `package.json` under `domain/` must include `"private": true`. Flag any package missing it.

## Entity Packages

- Define the canonical data model (Zod schemas + branded value objects)
- Own the Redux slice (`createSlice`) for the entity's state
- Export selectors for reading entity state
- Provide mock factories (`*.mock.ts`) for tests — not re-exported from barrel
- `zod` and `@reduxjs/toolkit` as `peerDependencies`
- Barrel export via `src/index.ts`

## API Packages

- Compose and re-export existing RTK Query `createApi` endpoints
- No new runtime logic — pure re-export/composition layer
- Must depend on the corresponding `@domain/entity-<name>` package
- Barrel export via `src/index.ts`
