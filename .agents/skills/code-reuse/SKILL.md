---
name: code-reuse
description: Avoid code duplication by extracting shared logic, components, and utilities. Read when reviewing for DRY violations or refactoring repeated patterns.
---

# Code Reuse Patterns

## Search Before You Create

- Before creating any new helper, mock, fixture, or utility, search the codebase with `rg` for existing implementations.
- If a pattern exists in 2+ places, extract it to a shared location rather than duplicating again.
- If duplicating logic for a "quick fix", add a TODO linking to a follow-up refactor ticket.

## Extraction Guidelines

### Shared UI Components

- When the same UI chrome (headers, drawers, layouts, spacers) repeats across multiple screens or states, extract a shared component.
- Place feature-level shared components in `FeatureName/components/`.
- Place app-level shared components in `src/mvvm/components/`.

### Shared Hooks and Utilities

- When the same lookup, validation, or transformation logic appears in 2+ files, extract to a shared utility.
- Place feature-level utilities in `FeatureName/utils/`.
- Place app-level utilities in `src/mvvm/utils/`.
- Never duplicate base-URL selection, dismissal lookup, or other configuration resolution logic — reuse existing helpers.

### Shared Test Utilities

- When test setup (mocks, fixtures, factories) duplicates across test files, extract to shared test utilities.
- Duplicated within one test file → extract a local helper function.
- Duplicated across 2+ test files → move to nearest `__tests__/shared.ts` or `tests/mocks/`.
- Used in one file only → keep local.

## Constants and Allowlists

- Never duplicate string literals for constant allowlists — define once at module scope.
- When a constant is already exported from another module, alias it rather than redefining.
- Prefer `Set` with `.has()` over arrays with `.includes()` for constant membership checks. See [`prefer-set-has`](../prefer-set-has/SKILL.md).

## Module and Package Boundaries

- Never re-implement logic that exists in a shared package — import from the canonical source.
- When similar logic exists in `libs/` and `apps/`, prefer the `libs/` version as the source of truth.
- Keep mock shapes aligned with real module APIs — do not export non-existent members in mocks.

## Code Smell Indicators

Flag these patterns during review:

- Same error handling block copy-pasted across files.
- Same validation regex or lookup logic in multiple places.
- Same UI layout (headers, footers, loading states) repeated across screens.
- Same mock setup duplicated across test files.
- Same constant string defined in multiple modules.
