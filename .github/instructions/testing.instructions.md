---
applyTo: "**/*.test.*,**/*.spec.*,**/__tests__/**,**/__integrations__/**"
---

<!-- Source: .cursor/rules/testing.mdc -->
<!-- Last synced: 2026-02-13 -->

# Testing

## Stack

- **Framework**: Jest
- **Network mocking**: MSW (Mock Service Worker)
- **Desktop UI**: React Testing Library
- **Mobile UI**: React Native Testing Library

## General Rules

- **Test behavior, not implementation** — assert on user-visible outcomes, not internal state.
- Tests must be **deterministic** — no flaky timing, no reliance on external services.
- Keep mocks **minimal** — favor realistic wiring over extensive mocking.
- Use `async/await` with `waitFor` for asynchronous assertions.
- Prefer **integration tests** for complex features to validate complete behavior.

## File Structure

- Tests live next to source files: `MyComponent.test.tsx` alongside `MyComponent.tsx`.
- Use `__tests__/` for grouped unit tests.
- Use `__integrations__/` for integration tests.
- Test data goes in `__fixtures__/` — use factories and builders, avoid hardcoded or unrealistic values.

## Query Priority

When selecting elements in tests, follow this order:

1. `ByRole` (preferred — matches accessibility tree)
2. `ByLabelText`
3. `ByText`
4. `ByTestId` (last resort)

## Desktop Testing

- **Render**: import the render function from `tests/testSetup`.
- **MSW server**: `apps/ledger-live-desktop/tests/server.ts`.
- **Run**: `pnpm test:jest "filename"` inside `apps/ledger-live-desktop`.

## Mobile Testing

- **Render**: import the render function from `@tests/test-renderer`.
- **MSW server**: `apps/ledger-live-mobile/__tests__/server.ts`.
- **Run**: `pnpm test:jest "filename"` inside `apps/ledger-live-mobile`.

## MSW Patterns

- Define handlers alongside tests or in shared handler files.
- Follow the existing patterns from the desktop and mobile server files referenced above.
- Mock at the network boundary — do not mock React components or hooks directly.

## Test Naming

- Use descriptive names: `it("should <behavior> when <condition>")`.
- One behavior per test — avoid testing multiple concerns in a single `it` block.

## Redux in Tests

- Desktop: pass `initialState` to the render function.
- Mobile: use `overrideInitialState`.
- Never mock feature flags directly — use `overriddenFeatureFlags`.
