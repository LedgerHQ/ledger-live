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

- Test behavior, not implementation — assert on user-visible outcomes, not internal state.
- Tests must be deterministic — no flaky timing, no reliance on external services.
- Use `async/await` with `waitFor` for asynchronous assertions.
- Prefer integration tests for complex features to validate complete behavior.

## Mocking Rules

- Keep mocks minimal — favor realistic wiring over extensive mocking.
- Never mock UI components in integration tests — test what the user sees.
- Do not duplicate mocks already defined in jest-setup files.
- Prefer dependency injection over mocking when possible.
- If the first 50+ lines of a test file are mocks, refactor to reduce mocking.
- Mock at the network boundary with MSW — do not mock React components or hooks directly.

## File Structure

- Tests live next to source files: `MyComponent.test.tsx` alongside `MyComponent.tsx`.
- Use `__tests__/` folders inside `components/`, `hooks/`, or `utils/` directories.
- Use `__integrations__/` for integration tests.
- Test data goes in `__fixtures__/` — use factories and builders, avoid hardcoded values.
- Keep test files focused — split large test files (500+ lines) into separate files per concern.

## Required Test Coverage

- Every new utility function in `utils/` must have unit tests.
- Every new helper function must be extracted to a testable file with tests.
- Every new custom hook must have dedicated tests.
- Every new feature under `src/mvvm/` must include integration tests in `__integrations__/`.

## Query Priority

1. `ByRole` (preferred — matches accessibility tree)
2. `ByLabelText`
3. `ByText`
4. `ByTestId` (last resort — avoid when possible)

Never use `toJSON()` for assertions when `getByText` or `getByRole` can verify the same behavior.

## Test Renderer Imports

- Desktop: import render from `tests/testSetup`.
- Mobile: import render from `@tests/test-renderer`.

Never import render directly from `@testing-library/react` or `@testing-library/react-native`.

## MSW Patterns

- Define handlers alongside tests or in shared handler files.
- Desktop MSW server: `apps/ledger-live-desktop/tests/server.ts`.
- Mobile MSW server: `apps/ledger-live-mobile/__tests__/server.ts`.

## Redux in Tests

- Desktop: pass `initialState` to the render function.
- Mobile: use `overrideInitialState`.
- Never mock feature flags directly — use `overriddenFeatureFlags`.

## Test Naming

- Use descriptive names: `it("should <behavior> when <condition>")`.
- One behavior per test — avoid testing multiple concerns in a single `it` block.
- Always provide explicit error messages in `.toThrow()` assertions.
