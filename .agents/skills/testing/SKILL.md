---
name: testing
description: |
  Write unit and integration tests for Ledger Wallet apps. 
  Use for Jest tests (Desktop/Mobile), MSW handlers and testing best practices.
  Integration tests fake HTTP with MSW `jest.fn()` endpoint mocks instead of `jest.mock`-ing modules.
  Applies to "*.test.*", "*.spec.*", "**/tests/**", "**/__tests__/**", "**/__integrations__/**", "**/jest-setup*"
---

# Ledger Wallet Testing Skill

> Jest + MSW + React Testing Library (Desktop) / React Native Testing Library (Mobile)
> ❌ E2E tests → Use `e2e-desktop-add-or-update` / `e2e-mobile-add-or-update` skills
> ⚠️ A new desktop flow needs Jest tests **and** an `e2e/desktop` spec. `apps/ledger-live-desktop/tests/specs` (mocked Playwright) is frozen: fix, update or delete, never add a spec file or test case.

---

## Golden Rules

1. **`toBeVisible()` over `toBeInTheDocument()`** — Always. `toBeInTheDocument` only checks DOM presence; elements can be hidden. Use `toBeInTheDocument` only when testing explicitly hidden elements.
2. **Search before you create** — Before writing any mock, fixture, or helper, `rg` the codebase. If it exists, import it. If your new mock is reusable (2+ files), put it in a shared location.
3. **Fake the network, not modules** — Integration tests run the real store, API clients and SDKs, and intercept HTTP with MSW [endpoint mocks](references/msw-endpoints.md). `jest.mock` only what cannot run under Jest (native modules, device transport). Never mock child components.
4. **Network requests via MSW, never `fetch`** — New test code must not mock `fetch`; use Mock Service Worker handlers instead.
5. **One behavior per test** — Name: `it("should <behavior> when <condition>")`.
6. **Query priority**: `getByRole` > `getByLabelText` > `getByText` > `getByTestId` (last resort).
7. **Feature flags via store, never mocked** — Use `overriddenFeatureFlags` in `initialState.settings`.
8. **Use existing factories** — `genAccount()` from `@ledgerhq/ledger-wallet-framework/mocks/account`, `getCryptoCurrencyById()` from `@ledgerhq/live-common/currencies`. Never recreate account/currency data from scratch.

---

## Quick Reference

```bash
pnpm test:jest "filename"    # Run specific file
pnpm test:jest               # Run all tests
pnpm test:jest --coverage    # Coverage report

# Coin modules (libs/coin-modules)
pnpm coin:<name> test              # Unit tests
pnpm coin:<name> test "filename"   # Specific file
pnpm coin:<name> test-integ        # Integration tests (slow)
```

| Platform | Render Import          | MSW Server            |
| -------- | ---------------------- | --------------------- |
| Desktop  | `tests/testSetup`      | `tests/server.ts`     |
| Mobile   | `@tests/test-renderer` | `__tests__/server.ts` |

---

## Test Template

```typescript
import { render, screen, waitFor } from "tests/testSetup";
import { HttpResponse, http, server } from "tests/server";

const endpoints = { data: jest.fn<Response, [{ request: Request }]>() };

describe("MyComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    endpoints.data.mockReset().mockImplementation(() => HttpResponse.json({ name: "Bitcoin" }));
    server.use(http.get("/api/data", endpoints.data));
  });

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
    render(<MyComponent />);
    await waitFor(() => expect(screen.getByText("Bitcoin")).toBeVisible());
    expect(endpoints.data).toHaveBeenCalledTimes(1);
  });

  it("should display an error when the API fails", async () => {
    endpoints.data.mockReturnValueOnce(HttpResponse.json({}, { status: 500 }));
    render(<MyComponent />);
    // ...
  });
});
```

Full recipe, traps and examples: [references/msw-endpoints.md](references/msw-endpoints.md).

---

## Testing Hooks

```typescript
import { renderHook, act, waitFor } from "tests/testSetup";

const { result } = renderHook(() => useMyHook());
await act(async () => result.current.increment());
expect(result.current.value).toBe(1);
```

---

## Redux Store

**Desktop** — plain object merged with defaults:

```typescript
render(<MyComponent />, {
  initialState: {
    settings: { theme: "dark" },
    accounts: { active: [mockAccount] },
  },
});
```

**Mobile** — function receiving default state:

```typescript
render(<MyScreen />, {
  overrideInitialState: (state: State) => ({
    ...state,
    settings: { ...state.settings, blacklistedTokenIds: ["ethereum/erc20/usdt"] },
  }),
});
```

**Feature flags** (both platforms):

```typescript
render(<MyComponent />, {
  initialState: {
    settings: {
      overriddenFeatureFlags: {
        myFlag: { enabled: true, params: { key: "value" } },
      },
    },
  },
});
```

---

## Mocking Patterns

```typescript
// HTTP: override an endpoint mock, never jest.mock the client (see references/msw-endpoints.md)
endpoints.data.mockReturnValueOnce(HttpResponse.json({ error: "Not found" }, { status: 404 }));

// Dependency that cannot run under Jest (native module, device transport)
jest.mock("react-native-some-native-module");
jest.mocked(nativeFn).mockReturnValue(value);

// ViewModel (MVVM): stub it only to unit test a View in isolation.
// Integration tests keep the real ViewModel and fake its HTTP calls instead.
jest.mock("../useMyViewModel", () => ({ useMyViewModel: jest.fn() }));
jest.spyOn(UseMyViewModel, "useMyViewModel").mockImplementation(() => ({
  data: mockData,
  isLoading: false,
}));
```

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

```bash
# Run BEFORE writing new mocks
rg "yourMockName|yourHelper" tests/ __tests__/ src/ libs/ --type ts
```

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

```
1. Search for existing mocks → 2. Write test → 3. Run test → 4. Fix if fail → 5. Next file
```

Start with the simplest units (utils, hooks), then work up to components with side effects (API, navigation). This order catches foundational bugs early and builds confidence incrementally.
