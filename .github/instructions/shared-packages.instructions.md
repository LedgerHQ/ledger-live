---
applyTo: "shared/**"
---

# Shared Package Conventions

When reviewing changes under `shared/`, enforce the following rules.

## Directory Structure

- Each package lives at `shared/<name>/` (e.g. `shared/feature-flags/`, `shared/observability/`)

## Package Naming

- Package name: `@shared/<name>` (e.g. `@shared/feature-flags`, `@shared/observability`)
- Packages must **not** use the `@ledgerhq/` scope — these are internal-only packages.

## `package.json` Requirements

Every `package.json` under `shared/` must include `"private": true`. Flag any package missing it.

## Responsibility

- Own non-domain state (feature flags, observability/telemetry consent, etc.)
- Define Zod schemas, RTK slices, selectors, and value objects for cross-cutting concerns
- Provide packages consumed by both LWD and LWM without creating domain dependencies

## Conventions

- One concern per package
- `package.json` must have `"private": true`
- Mock and test files are not re-exported from the barrel
- Shared packages should have **no dependencies** on `domain/` packages (dependency flows one way: domain -> shared is allowed if needed, but shared -> domain is not)
