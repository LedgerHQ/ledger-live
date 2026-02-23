---
applyTo: "**/*.test.*,**/*.spec.*,**/__tests__/**,**/__integrations__/**"
---

<!-- Source: .cursor/rules/jest-mocks.mdc -->
<!-- Last synced: 2026-02-20 -->

# Jest Mock Review

When reviewing changes to test files, flag these patterns that cause flaky tests and mock cannibalization with parallel workers (`--maxWorkers=50%`).

## 1. Duplicate mocks

**Flag:** `jest.mock("module")` in a test file when that module is already mocked in the app's jest-setup.

**Check:** Scan the jest-setup file for the app:
- Mobile: `apps/ledger-live-mobile/__tests__/jest-setup.js`
- Desktop: `apps/ledger-live-desktop/tests/jestSetup.js`

If the module appears in `jest.mock("...")` there, the test should not duplicate it.

**Preferred:** Use the global mock and `jest.mocked(module.export).mockReturnValue(...)` in `beforeEach`.

## 2. Hooks at describe load time

**Flag:** `renderHook(...).result.current` or any hook call at the top level of a `describe` block (outside `beforeEach` / `beforeAll` / test callbacks).

This can crash Jest workers when running in parallel. Move into `beforeEach` or inside each test.

## 3. `jest.restoreAllMocks()`

**Flag:** Use of `jest.restoreAllMocks()` in test files.

It restores **all** mocks including global ones from jest-setup, breaking other tests.

**Preferred:** Use `jest.clearAllMocks()` or `mock.mockRestore()` for specific spies only.

## 4. Wrong `beforeEach` order

**Flag:** `jest.clearAllMocks()` called **after** `mockReturnValue()` or other mock configuration.

This clears the mock configuration. Call `clearAllMocks` first, then configure mocks.
