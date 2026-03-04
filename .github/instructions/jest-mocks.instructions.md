---
applyTo: "**/*.test.*,**/*.spec.*,**/__tests__/**,**/__integrations__/**"
---

# Jest Mock Review

Flag these patterns that cause flaky tests and mock cannibalization with parallel workers.

## 1. Duplicate Mocks

**Flag:** `jest.mock("module")` when already mocked in jest-setup.

**Check jest-setup files:**
- Mobile: `apps/ledger-live-mobile/__tests__/jest-setup.js`
- Desktop: `apps/ledger-live-desktop/tests/jestSetup.js`

**Preferred:** Use global mock and `jest.mocked(module.export).mockReturnValue(...)` in `beforeEach`.

## 2. Excessive Mocking

**Flag:** Test files where mocks exceed 50 lines or mock more than 5 modules.

**Flag:** Mocking UI components like `Text`, `View`, `Button`, or design system components.

**Preferred:** Use the test renderer from `@tests/test-renderer` which handles common mocks.

## 3. Hooks at Describe Load Time

**Flag:** `renderHook(...).result.current` at top level of `describe` block.

**Preferred:** Move hook calls into `beforeEach` or inside each test.

## 4. `jest.restoreAllMocks()`

**Flag:** Use of `jest.restoreAllMocks()` in test files.

**Preferred:** Use `jest.clearAllMocks()` or `mock.mockRestore()` for specific spies only.

## 5. Wrong `beforeEach` Order

**Flag:** `jest.clearAllMocks()` called after `mockReturnValue()` configuration.

**Preferred:** Call `clearAllMocks` first, then configure mocks.

## 6. Implementation-Coupled Tests

**Flag:** Tests that only verify mock calls without asserting user-visible outcomes.

**Flag:** Tests that mock the module under test rather than its dependencies.

**Preferred:** Assert on rendered output, user interactions, or state changes.
