# domain/api/

Domain API composition packages. Each subdirectory is an independent pnpm workspace package that re-exports or composes existing RTK Query `createApi` endpoints under a unified access point for a domain.

## Scope

`@domain/api-<name>` (e.g. `@domain/api-market`, `@domain/api-crypto-assets`)

## Responsibility

- **Compose and re-export** existing RTK Query APIs relevant to a domain
- Provide a single import path for all API endpoints related to a domain entity
- No new runtime logic — pure re-export/composition layer

## Conventions

- One API package per domain entity
- Package name: `@domain/api-<name>`
- Directory name: `domain/api/<name>/`
- `package.json` must have `"private": true`
- Must depend on the corresponding `@domain/entity-<name>` package
- Barrel export via `src/index.ts`
