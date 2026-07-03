---
name: testing
description: |
  Write unit and integration tests for Ledger Wallet apps. 
  Use for Jest tests (Desktop/Mobile), MSW handlers and testing best practices.
  Applies to "*.test.*", "*.spec.*", "**/tests/**", "**/__tests__/**", "**/__integrations__/**", "**/jest-setup*"
---

# Ledger Wallet Testing Skill

> Jest + MSW + React Testing Library (Desktop) / React Native Testing Library (Mobile)
> ❌ E2E tests → Use `e2e` skill

---

## Golden Rules

1. **`toBeVisible()` over `toBeInTheDocument()`** — Always. `toBeInTheDocument` only checks DOM presence; elements can be hidden. Use `toBeInTheDocument` only when testing explicitly hidden elements.
2. **Search before you create** — Before writing any mock, fixture, or helper, `rg` the codebase. If it exists, import it. If your new mock is reusable (2+ files), put it in a shared location.
3. **Mock external deps only** — Never mock child components. Test integration.
4. **One behavior per test** — Name: `it("should <behavior> when <condition>")`.
5. **Query priority**: `getByRole` > `getByLabelText` > `getByText` > `getByTestId` (last resort).
6. **Feature flags via store, never mocked** — Use `overriddenFeatureFlags` in `initialState.settings`.
7. **Use existing factories** — `genAccount()` from `@ledgerhq/ledger-wallet-framework/mocks/account`, `getCryptoCurrencyById()` from `@ledgerhq/live-common/currencies`. Never recreate account/currency data from scratch.

---

## Test Coverage Requirements

**New features require tests** — Every new feature, bug fix, or code path must have corresponding automated tests before merge.

**Cover all branches** — When code has conditional logic (feature flags, platform checks, error paths), test each branch explicitly.

**Edge cases are mandatory** — Always test empty inputs, zero values, null/undefined, whitespace strings, and boundary conditions.

**Integration tests for MVVM** — New features under `src/mvvm/` require an `__integrations__/` test when the folder is first added.

---

## Test Implementation Rules

**Assertions must verify actual behavior** — Never write tests that only click buttons without verifying the action happened; always assert on the resulting state change.

**Assert array length before iterating** — An empty array iteration silently passes; check `expect(array).toHaveLength(expectedLength)` first.

**Prefer `toEqual([])` over `toHaveLength(0)`** — More explicit and catches type issues.

**Use `toEqual` with `objectContaining` for complex assertions** — Prefer `expect(result).toEqual([expect.objectContaining({ id: "expected" })])` over index access.

**Never use `toThrow()` without parameters** — Always specify the expected error message or type.

**Verify selected/active state, not just visibility** — When testing navigation or tabs, assert the element is actually selected, not merely visible.

---

## Mock Management

**Place `jest.mock` calls before imports** — Mocks declared after imports won't affect the module under test.

**Never use `jest.restoreAllMocks()`** — It restores global mocks from jest-setup and breaks other tests; use `jest.clearAllMocks()` instead.

**Always restore modified globals** — When modifying `window.*`, `Config.*`, or global state, restore original values in `afterEach`.

**Remove unused mocks** — Dead mocks make tests harder to understand and can hide accidental dependencies.

**Mock i18n values must match production strings** — Divergent mock translations hide copy regressions; align mocks with actual locale files.

---

## Test Isolation

**Reset global state after each test** — Tests that mutate global config (e.g., `coinConfig`) must restore it in `afterEach` to prevent cross-test pollution.

**Await async cleanup** — When `afterEach` calls async functions (e.g., `i18n.changeLanguage`), await them to prevent race conditions.

**Clear mocks in correct order** — Call `jest.clearAllMocks()` before `mockReturnValue()`, not after.

---

## Async Testing

**Always await async operations** — Missing `await` causes race conditions and flaky tests.

**Use deterministic waits** — Prefer `waitFor(() => expect(...))` over arbitrary timeouts or immediate assertions on async UI.

**Handle all observable terminal states** — When testing observables/streams, cover `Completed`, `Error`, `Stopped`, and `NotStarted` states.

---

## Test Data Integrity

**Fixture values must be explicit** — Don't rely on helper defaults; set all relevant fields explicitly so tests are self-documenting.

**Test data must match production contracts** — Mock API responses must use the same shape as real APIs (e.g., `undefined` for missing `nextCursor`, not empty string).

**Avoid hardcoded remote values** — Don't assert on specific error messages from external APIs; assert on error codes/classes instead.

---

## Feature Flag Testing

**Test both flag states** — When code branches on a feature flag, write tests for both enabled and disabled states.

**Explicitly set required flags** — Don't rely on environment defaults; explicitly enable/disable flags needed for the test scenario.

**Cover progressive rollout scenarios** — When a feature has multiple configurations in production, test each configuration.

---

## Quick Reference

pnpm test:jest "filename"    # Run specific file
pnpm test:jest               # Run all tests
pnpm test:jest --coverage    # Coverage report

# Coin modules (libs/coin-modules)
pnpm coin:<name> test              # Unit tests
pnpm coin:<name> test "filename"   # Specific file
pnpm coin:<name> test-integ        # Integration tests (slow)
| Platform | Render Import          | MSW Server            |
| -------- | ---------------------- | --------------------- |
| Desktop  | `tests/testSetup`      | `tests/server.ts`     |
| Mobile   | `@tests/test-renderer` | `__tests__/server.ts` |

---

## Test Template

import { render, screen, waitFor } from "tests/testSetup";
import { server } from "tests/server";
import { http, HttpResponse } from "msw";

jest.mock("@ledgerhq/live-common/someService");

describe("MyComponent", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should render title", () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText("Test")).toBeVisible();
  });

  it("should call onClick when button pressed", async () => {
    const onClick = jest.fn();
    const { user } = render(<MyComponent onClick={onClick} />);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should display fetched data", async () => {
    server.use(http.get("/api/data", () => HttpResponse.json({ name: "Bitcoin" })));
    render(<MyComponent />);
    await waitFor(() => expect(screen.getByText("Bitcoin")).toBeVisible());
  });
});
---

## Testing Hooks

import { renderHook, act, waitFor } from "tests/testSetup";

const { result } = renderHook(() => useMyHook());
await act(async () => result.current.increment());
expect(result.current.value).toBe(1);
---

## Redux Store

**Desktop** — plain object merged with defaults:

render(<MyComponent />, {
  initialState: {
    settings: { theme: "dark" },
    accounts: { active: [mockAccount] },
  },
});
**Mobile** — function receiving default state:

render(<MyScreen />, {
  overrideInitialState: (state: State) => ({
    ...state,
    settings: { ...state.settings, blacklistedTokenIds: ["ethereum/erc20/usdt"] },
  }),
});
**Feature flags** (both platforms):

render(<MyComponent />, {
  initialState: {
    settings: {
      overriddenFeatureFlags: {
        myFlag: { enabled: true, params: { key: "value" } },
      },
    },
  },
});
---

## Mocking Patterns

// External dependency
jest.mock("@ledgerhq/live-common/account/index");
const mockedFn = jest.mocked(getMainAccount);
mockedFn.mockReturnValue(mockAccount);

// ViewModel (MVVM)
jest.mock("../useMyViewModel", () => ({ useMyViewModel: jest.fn() }));
jest.spyOn(UseMyViewModel, "useMyViewModel").mockImplementation(() => ({
  data: mockData,
  isLoading: false,
}));

// MSW override for error case
server.use(http.get("/api/data", () => HttpResponse.json({ error: "Not found" }, { status: 404 })));
---

## Shared Resources — Search Here First

Before creating anything, check these locations:

| Location                                          | What's there                                              |
| ------------------------------------------------- | --------------------------------------------------------- |
| `@ledgerhq/ledger-wallet-framework/mocks/account` | `genAccount()`, `genTokenAccount()`                       |
| `@ledgerhq/live-common/currencies`                | `getCryptoCurrencyById()`, `getTokenById()`               |
| `tests/handlers/`                                 | MSW handlers (market, assets, countervalues, cryptoIcons) |
| `tests/handlers/fixtures/`                        | JSON fixtures for API responses                           |
| `tests/fixtures/`                                 | `mockedAccountList`, `expectedCurrencyList`               |
| `tests/mocks/`                                    | Mock components, assets, countervalues                    |

# Run BEFORE writing new mocks
rg "yourMockName|yourHelper" tests/ __tests__/ src/ libs/ --type ts
New reusable mocks go in `tests/mocks/`, new handlers in `tests/handlers/`, new fixtures in `tests/handlers/fixtures/`.

---

## Mock Anti-Patterns

These cause flaky tests and mock cannibalization when running with parallel workers (`--maxWorkers=50%`).

**Duplicate mocks** — Don't `jest.mock("module")` in a test file when it's already mocked in jest-setup (`apps/ledger-live-mobile/__tests__/jest-setup.js` or `apps/ledger-live-desktop/tests/jestSetup.js`). Use `jest.mocked(module.export).mockReturnValue(...)` in `beforeEach` instead.

**Hooks at describe load time** — Never call `renderHook(...)` or access `.result.current` at the top level of a `describe` block. Move into `beforeEach` or inside each test — calling hooks outside of test callbacks crashes Jest parallel workers.

**`jest.restoreAllMocks()`** — Never use this; it restores global mocks from jest-setup and breaks other tests. Use `jest.clearAllMocks()` or `mock.mockRestore()` for specific spies only.

**Wrong `beforeEach` order** — Call `jest.clearAllMocks()` _before_ `mockReturnValue()` or other mock configuration — not after (calling clear after wipes the setup).

---

## Workflow

1. Search for existing mocks → 2. Write test → 3. Run test → 4. Fix if fail → 5. Next file
Start with the simplest units (utils, hooks), then work up to components with side effects (API, navigation). This order catches foundational bugs early and builds confidence incrementally.
