# domain/api/

Domain API packages. Each subdirectory is an independent pnpm workspace package that defines RTK Query `createApi` endpoints or re-exports/composes existing ones under a unified access point for a domain.

## Scope

`@domain/api-<name>` (e.g. `@domain/api-market`, `@domain/api-crypto-assets`)

## Responsibility

- **Define** new RTK Query `createApi` endpoints for a domain, or **compose and re-export** existing ones
- Provide a single import path for all API endpoints related to a domain entity
- Use entity schemas from `@domain/entity-<name>` for request/response typing

## Conventions

- One API package per domain entity
- Package name: `@domain/api-<name>`
- Directory name: `domain/api/<name>/`
- `package.json` must have `"private": true`
- Must depend on the corresponding `@domain/entity-<name>` package
- Barrel export via `src/index.ts`

## File Structure

Each package follows this file layout inside `src/`:

```
api.ts          # createApi definition or re-export (required)
api.test.ts     # MSW-based endpoint tests (required if new endpoints)
index.ts        # Barrel exports (required)
```
