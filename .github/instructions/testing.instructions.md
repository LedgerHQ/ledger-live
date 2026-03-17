---
applyTo: "**/*.test.*,**/*.spec.*,**/__tests__/**,**/__integrations__/**"
---

# Testing

## Stack

- **Framework**: Jest
- **Network mocking**: MSW (Mock Service Worker)
- **Desktop UI**: React Testing Library (`tests/testSetup`)
- **Mobile UI**: React Native Testing Library (`@tests/test-renderer`)

## General Rules

- **Test behavior, not implementation** — assert on user-visible outcomes, not internal state.
- Tests must be **deterministic** — no flaky timing, no reliance on external services.
- Always use the app's custom test renderer — never import directly from `@testing-library/react` or `@testing-library/react-native`.
- Every test must end with at least one positive assertion — avoid tests that only wait or navigate without verifying outcomes.
- Use `async/await` with `waitFor` for asynchronous assertions.

## Mocking Rules

- Keep mocks **minimal** — favor realistic wiring over extensive mocking.
- Never mock UI components — test what the user sees, not implementation details.
- Mock at the network boundary with MSW — do not mock React components, hooks, or Redux directly in test files.
- If a test file starts with many lines of mocks, refactor to reduce mocking or use dependency injection.
- Check jest-setup before adding mocks — do not duplicate mocks already defined globally.

## Assertions

- Use strong matchers like `toEqual`, `toMatchObject`, or `toBeVisible` — avoid weak matchers like `not.toBeNull`.
- Always specify expected error messages in `.rejects.toThrow("expected message")`.
- Prefer `getByRole` and `getByText` over `getByTestId` — test-ids are a last resort.

## File Structure

- Tests live next to source files: `MyComponent.test.tsx` alongside `MyComponent.tsx`.
- Group unit tests in `__tests__/` folders within the relevant directory.
- Place integration tests in `__integrations__/` folders.
- Use `__fixtures__/` for test data with factories and builders.

## Coverage Requirements

- New features must include integration tests validating complete behavior.
- Utility functions in `utils/` must have unit tests.
- Hooks must have dedicated tests covering logic and edge cases.
- When adding helper functions, extract them to a utils file and add tests.

## MSW Patterns

- Define handlers alongside tests or in shared handler files.
- Follow patterns from `apps/ledger-live-desktop/tests/server.ts` and `apps/ledger-live-mobile/__tests__/server.ts`.

## Redux in Tests

- Desktop: pass `initialState` to the render function.
- Mobile: use `overrideInitialState`.
- Never mock feature flags directly — use `overriddenFeatureFlags`.
