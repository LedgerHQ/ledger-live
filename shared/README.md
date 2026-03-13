# shared/

Cross-cutting concern packages that don't belong to a specific business domain. Each subdirectory is an independent pnpm workspace package.

## Scope

`@shared/<name>` (e.g. `@shared/feature-flags`, `@shared/observability`)

## Responsibility

- Own **non-domain state** (feature flags, observability/telemetry consent, etc.)
- Define Zod schemas, RTK slices, selectors, and value objects for cross-cutting concerns
- Provide packages that are consumed by both LWD and LWM without creating domain dependencies

## Conventions

- One concern per package
- Package name: `@shared/<name>`
- Directory name: `shared/<name>/`
- `package.json` must have `"private": true`
- Mock and test files are not re-exported from the barrel
- Shared packages should have **no dependencies** on `domain/` packages (dependency flows one way: domain -> shared is allowed if needed, but shared -> domain is not)

## Internal Structure

Shared packages have **free internal structure** — organize `src/` however makes sense for the concern. The only convention: when a shared package interfaces with Redux (schema + slice + selectors), place that code in a `data/` subfolder following the same structure as `domain/entity/*/src/` (i.e. `schema.ts`, `slice.ts`, `selectors.ts`, `*.test.ts`, `*.mock.ts`, `index.ts`).
