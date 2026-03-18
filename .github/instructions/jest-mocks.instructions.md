---
applyTo: "**/*.test.*,**/*.spec.*,**/__tests__/**,**/__integrations__/**"
---

# Jest Mock Review

## 1. Duplicate mocks

Flag `jest.mock("module")` in a test file when that module is already mocked in the app's jest-setup — use `jest.mocked(module).mockReturnValue(...)` in `beforeEach` instead.

## 2. Hooks at describe load time

Flag `renderHook(...).result.current` or any hook call at the top level of a `describe` block — move into `beforeEach` or inside each test.

## 3. `jest.restoreAllMocks()`

Flag use of `jest.restoreAllMocks()` — use `jest.clearAllMocks()` or `mock.mockRestore()` for specific spies only.

## 4. Wrong `beforeEach` order

Flag `jest.clearAllMocks()` called after mock configuration — call `clearAllMocks` first, then configure mocks.

## 5. Excessive mocking

Flag test files with more than 150 lines of mocks before actual tests — prefer MSW for network mocking and `overrideInitialState` for Redux state.

## 6. Mocking components unnecessarily

Flag mocks of React components when using the custom test renderer — use `overrideInitialState` or `overriddenFeatureFlags` instead.

## 7. Network mocking

Never mock axios or fetch directly — use MSW (Mock Service Worker) for all network mocking.
