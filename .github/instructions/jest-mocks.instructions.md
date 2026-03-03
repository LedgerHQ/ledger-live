---
applyTo: "**/*.test.*,**/*.spec.*,**/__tests__/**,**/__integrations__/**"
---

# Jest Mock Review

Flag these patterns that cause flaky tests and mock issues with parallel workers.

## 1. Duplicate mocks

**Flag:** `jest.mock("module")` in a test file when that module is already mocked in jest-setup.
**Check:** Mobile: `apps/ledger-live-mobile/__tests__/jest-setup.js`; Desktop: `apps/ledger-live-desktop/tests/jestSetup.js`.
**Preferred:** Use the global mock and `jest.mocked(module.export).mockReturnValue(...)` in `beforeEach`.

## 2. Hooks at describe load time

**Flag:** `renderHook(...).result.current` or any hook call at top level of a `describe` block.
Move hook calls into `beforeEach` or inside each test.

## 3. `jest.restoreAllMocks()`

**Flag:** Use of `jest.restoreAllMocks()` in test files — it breaks global mocks from jest-setup.
**Preferred:** Use `jest.clearAllMocks()` or `mock.mockRestore()` for specific spies only.

## 4. Wrong `beforeEach` order

**Flag:** `jest.clearAllMocks()` called **after** `mockReturnValue()` — this clears the config.
Call `clearAllMocks` first, then configure mocks.

## 5. Unrestored spies

**Flag:** `jest.spyOn()` without corresponding `mockRestore()` in `afterEach`.
Spies on prototypes (e.g., `Storage.prototype.getItem`) leak into other test files.

## 6. Mismatched mock types

**Flag:** Mocking a function with wrong return type (e.g., `BigNumber` when implementation returns `bigint`).
Mock values must match the actual API types to catch conversion issues.

## 7. Invalid Jest matchers

**Flag:** Use of `expect.arrayOf()` — this is not a valid Jest matcher.
**Preferred:** Use `expect.arrayContaining([...])` for array assertions.
