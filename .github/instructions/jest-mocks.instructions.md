---
applyTo: "**/*.test.*,**/*.spec.*,**/__tests__/**,**/__integrations__/**"
---

# Jest Mock Review

Flag these patterns that cause flaky tests and mock cannibalization with parallel workers.

## 1. Duplicate mocks

**Flag:** `jest.mock("module")` when already mocked in jest-setup (`apps/ledger-live-mobile/__tests__/jest-setup.js` or `apps/ledger-live-desktop/tests/jestSetup.js`).

**Preferred:** Use global mock and configure with `jest.mocked(module.export).mockReturnValue(...)` in `beforeEach`.

## 2. Hooks at describe load time

**Flag:** `renderHook(...).result.current` or hook calls at top level of `describe` (outside `beforeEach`/`beforeAll`/test callbacks).

## 3. `jest.restoreAllMocks()`

**Flag:** Use of `jest.restoreAllMocks()` — it restores global mocks from jest-setup, breaking other tests.

**Preferred:** Use `jest.clearAllMocks()` or `mock.mockRestore()` for specific spies.

## 4. Wrong `beforeEach` order

**Flag:** `jest.clearAllMocks()` called after mock configuration — call `clearAllMocks` first, then configure.

## 5. Excessive mocking

**Flag:** Test files where the first 100+ lines are mock declarations — refactor to reduce mocking or use dependency injection.

**Flag:** Mocking UI components instead of testing actual rendered output.

## 6. Missing assertions after waits

**Flag:** Tests that use `waitFor` or navigation steps without a subsequent assertion verifying the expected state.
