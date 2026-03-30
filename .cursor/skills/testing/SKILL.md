---
name: testing
description: Write unit and integration tests for Ledger Wallet apps. Use for Jest tests (Desktop/Mobile), MSW handlers, or testing best practices.
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
7. **Use existing factories** — `genAccount()` from `@ledgerhq/coin-framework/mocks/account`, `getCryptoCurrencyById()` from `@ledgerhq/live-common/currencies`. Never recreate account/currency data from scratch.

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
```

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
server.use(
  http.get("/api/data", () => HttpResponse.json({ error: "Not found" }, { status: 404 }))
);
```

---

## Shared Resources — Search Here First

Before creating anything, check these locations:

| Location | What's there |
| --- | --- |
| `@ledgerhq/coin-framework/mocks/account` | `genAccount()`, `genTokenAccount()` |
| `@ledgerhq/live-common/currencies` | `getCryptoCurrencyById()`, `getTokenById()` |
| `tests/handlers/` | MSW handlers (market, assets, countervalues, cryptoIcons) |
| `tests/handlers/fixtures/` | JSON fixtures for API responses |
| `tests/fixtures/` | `mockedAccountList`, `expectedCurrencyList` |
| `tests/mocks/` | Mock components, assets, countervalues |

```bash
# Run BEFORE writing new mocks
rg "yourMockName|yourHelper" tests/ __tests__/ src/ libs/ --type ts
```

New reusable mocks go in `tests/mocks/`, new handlers in `tests/handlers/`, new fixtures in `tests/handlers/fixtures/`.

---

## Workflow

```
1. Search for existing mocks → 2. Write test → 3. Run test → 4. Fix if fail → 5. Next file
```

Start with the simplest units (utils, hooks), then work up to components with side effects (API, navigation). This order catches foundational bugs early and builds confidence incrementally.