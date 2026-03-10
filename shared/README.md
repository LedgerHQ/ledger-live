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
