---
applyTo: "**/*.test.*,**/*.spec.*,**/__tests__/**,**/__integrations__/**"
---

# Testing

## Stack

- **Framework**: Jest
- **Network mocking**: MSW (Mock Service Worker)
- **Desktop UI**: React Testing Library
- **Mobile UI**: React Native Testing Library

## General Rules

- Test behavior, not implementation — assert on user-visible outcomes.
- Tests must be deterministic — no flaky timing, no reliance on external services.
- Keep mocks minimal — favor MSW for network calls and realistic wiring over extensive mocking.
- Use `async/await` with `waitFor` for asynchronous assertions.
- Prefer integration tests for complex features.

## File Structure

- Tests live next to source files: `MyComponent.test.tsx` alongside `MyComponent.tsx`.
- Use `__tests__/` for grouped unit tests and `__integrations__/` for integration tests.
- Test data goes in `__fixtures__/` — use factories and builders, avoid hardcoded values.

## Query Priority

1. `ByRole` (preferred), 2. `ByLabelText`, 3. `ByText`, 4. `ByTestId` (last resort).

## Desktop Testing

- Render: import from `tests/testSetup`.
- MSW server: `apps/ledger-live-desktop/tests/server.ts`.
- Run: `pnpm test:jest "filename"` inside `apps/ledger-live-desktop`.

## Mobile Testing

- Render: import from `@tests/test-renderer`.
- MSW server: `apps/ledger-live-mobile/__tests__/server.ts`.
- Run: `pnpm test:jest "filename"` inside `apps/ledger-live-mobile`.

## Redux in Tests

- Desktop: pass `initialState` to the render function.
- Mobile: use `overrideInitialState`.
- Never mock feature flags directly — use `overriddenFeatureFlags`.

## Parameterized Tests

Use `it.each` or `describe.each` when testing the same behavior with multiple inputs.
