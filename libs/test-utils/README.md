# test-utils

`@ledgerhq/test-utils` is a shared test-support package for the Ledger Live monorepo. It provides dummy application scaffolding and reusable helpers that multiple test suites depend on, keeping test boilerplate out of production packages.

## What it does

- Exports lightweight dummy app wrappers and stubs for use in Jest unit and integration tests.
- Centralises test-only utilities so they can be updated in one place without touching every consumer.

## Key exports / concepts

- See `src/index.ts` for the current public surface — it is intentionally kept small and grows with genuine cross-package test needs.

## Usage context

Consumed as a `devDependency` by packages that need shared test scaffolding. Not imported by any production code.
