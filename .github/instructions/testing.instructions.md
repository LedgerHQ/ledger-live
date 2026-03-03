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

- **Test behavior, not implementation** — assert on user-visible outcomes, not internal state.
- Tests must be **deterministic** — no flaky timing, no reliance on external services.
- Keep mocks **minimal** — favor realistic wiring over extensive mocking.
- Prefer **integration tests** for complex features to validate complete behavior.

## Test Isolation

- Always restore spies in `afterEach` or call `mockRestore()` on specific spies.
- Never use `jest.restoreAllMocks()` — it breaks global mocks from jest-setup.
- Reset module-level state (e.g., `initialized` flags) between tests using `jest.resetModules()`.
- Store computed values (like timestamps) in local constants and reuse them in assertions.

## Fake Timers

- Use `jest.useFakeTimers()` and `jest.setSystemTime()` for any time-dependent logic.
- Always restore real timers in `afterEach` with `jest.useRealTimers()` or reset system time.
- Prefer `await waitFor(...)` over `advanceTimersByTimeAsync` for async assertions.

## Feature Flags in Tests

- Never mock feature flags directly — use `overriddenFeatureFlags` option in render.
- Always set required feature flags when testing flag-gated behavior.

## Assertions

- Use `expect.assertions(n)` or `await expect(...).rejects` for error-path tests.
- Never use `toBeDefined()` alone — assert on specific expected values.
- Ensure test names match what is actually being asserted.

## File Structure

- Tests live next to source files: `MyComponent.test.tsx` alongside `MyComponent.tsx`.
- Use `__tests__/` for grouped unit tests and `__integrations__/` for integration tests.

## Query Priority

1. `ByRole` (preferred), 2. `ByLabelText`, 3. `ByText`, 4. `ByTestId` (last resort).

## Platform-Specific

- **Desktop render**: import from `tests/testSetup`; **MSW**: `tests/server.ts`.
- **Mobile render**: import from `@tests/test-renderer`; **MSW**: `__tests__/server.ts`.
