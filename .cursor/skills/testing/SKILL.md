---
name: testing
description: Write unit and integration tests for Ledger Wallet apps. Use for Jest tests (Desktop/Mobile), MSW handlers, or testing best practices.
---

# Ledger Wallet Testing Skill

> **Stack**: Jest + MSW + React Testing Library (Desktop) / React Native Testing Library (Mobile)

## When to Apply

✅ Writing tests for components, hooks, or utilities
✅ Setting up MSW network mocks
✅ Reviewing test completeness

❌ E2E tests (Playwright/Detox) → Use `e2e` skill

---

## Quick Reference

```bash
# Inside apps/ledger-live-desktop or apps/ledger-live-mobile
pnpm test:jest "filename"    # Run specific file
pnpm test:jest               # Run all tests
pnpm test:jest --coverage    # Coverage report
```

| Platform | Render Import          | MSW Server            |
| -------- | ---------------------- | --------------------- |
| Desktop  | `tests/testSetup`      | `tests/server.ts`     |
| Mobile   | `@tests/test-renderer` | `__tests__/server.ts` |

```bash
# Test a coin module in libs/coin-modules
# example for libs/coin-modules/coin-sui
pnpm coin:sui test # Run all unit tests
pnpm coin:sui test "filename" # Run specific test
pnpm coin:sui test-integ # Run all integration tests (slow)
```
---

## Test Template

```typescript
import { render, screen, waitFor } from "tests/testSetup";
import { renderHook } from "tests/testSetup"; // For hooks
import { server } from "tests/server";
import { http, HttpResponse } from "msw";
import { MyComponent } from "./MyComponent";

// ✅ Mock external deps only (not child components)
jest.mock("@ledgerhq/live-common/someService");

describe("MyComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render correctly", () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("should handle click", async () => {
    const onClick = jest.fn();
    const { user } = render(<MyComponent onClick={onClick} />);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should fetch data from API", async () => {
    server.use(
      http.get("/api/data", () => HttpResponse.json({ name: "Bitcoin" }))
    );
    render(<MyComponent />);
    await waitFor(() => {
      expect(screen.getByText("Bitcoin")).toBeInTheDocument();
    });
  });
});
```

---

## Core Rules

### Query Priority

```typescript
// ✅ Best → Worst
screen.getByRole("button", { name: "Submit" }); // 1. ByRole
screen.getByLabelText("Email"); // 2. ByLabelText
screen.getByText(/welcome/i); // 3. ByText
screen.getByTestId("submit-btn"); // 4. ByTestId (last resort)
```

### Naming Convention

```typescript
it("should <behavior> when <condition>");
// Examples:
it("should show error when validation fails");
it("should disable button when loading");
```

### One Behavior Per Test

```typescript
// ✅ Good
it("should disable button when loading", () => {
  render(<Button loading />);
  expect(screen.getByRole("button")).toBeDisabled();
});

// ❌ Bad - multiple assertions
it("should handle loading", () => {
  render(<Button loading />);
  expect(screen.getByRole("button")).toBeDisabled();
  expect(screen.getByText("Loading...")).toBeInTheDocument();
});
```

---

## Testing Hooks

```typescript
import { renderHook, act, waitFor } from "tests/testSetup";

describe("useMyHook", () => {
  it("should update value", async () => {
    const { result } = renderHook(() => useMyHook());

    await act(async () => {
      result.current.increment();
    });

    expect(result.current.value).toBe(1);
  });
});
```

---

## Redux Store (initialState)

### Desktop — `initialState`

```typescript
import { render, renderHook } from "tests/testSetup";

// For components
render(<MyComponent />, {
  initialState: {
    settings: {
      theme: "dark",
      language: "en",
    },
    accounts: {
      active: [mockAccount],
    },
  },
});

// For hooks
renderHook(() => useMyHook(), {
  initialState: {
    settings: { counterValue: "USD" },
  },
});
```

### Mobile — `overrideInitialState`

```typescript
import { render, renderHook } from "@tests/test-renderer";
import { State } from "~/reducers/types";

// For components
render(<MyScreen />, {
  overrideInitialState: (state: State) => ({
    ...state,
    settings: {
      ...state.settings,
      blacklistedTokenIds: ["ethereum/erc20/usdt"],
    },
    accounts: {
      ...state.accounts,
      active: [mockAccount],
    },
  }),
});

// For hooks
renderHook(() => useStake(), {
  overrideInitialState: (state: State) => ({
    ...state,
    settings: {
      ...state.settings,
      overriddenFeatureFlags: {
        stakePrograms: mockFeatureFlag,
      },
    },
  }),
});
```

> ⚠️ **Mobile uses a function** that receives the default state and returns the overridden state. **Desktop uses a plain object** that is merged with defaults.

---

## Mocking Patterns

### External Dependencies

```typescript
jest.mock("@ledgerhq/live-common/account/index");
const mockedGetMainAccount = jest.mocked(getMainAccount);

beforeEach(() => {
  mockedGetMainAccount.mockReturnValue(mockAccount);
});
```

### ViewModel Pattern (MVVM)

```typescript
jest.mock("../useMyViewModel", () => ({
  useMyViewModel: jest.fn(),
}));

jest.spyOn(UseMyViewModel, "useMyViewModel").mockImplementation(() => ({
  data: mockData,
  isLoading: false,
}));
```

### MSW Network Mocking

```typescript
import { server } from "tests/server";
import { http, HttpResponse } from "msw";

it("should handle API error", async () => {
  server.use(
    http.get("/api/data", () => HttpResponse.json({ error: "Not found" }, { status: 404 }))
  );
  render(<MyComponent />);
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

---

## Feature Flags

**⚠️ NEVER mock feature flags** — Use `overriddenFeatureFlags` in settings instead.

Feature flags are managed through the Redux store. Override them via `initialState.settings.overriddenFeatureFlags`:

```typescript
// ✅ GOOD — Override via store settings
render(<MyComponent />, {
  initialState: {
    settings: {
      overriddenFeatureFlags: {
        myFeatureFlag: {
          enabled: true,
          params: { someParam: "value" },
        },
      },
    },
  },
});

// ✅ GOOD — For hooks
renderHook(() => useMyHook(), {
  initialState: {
    settings: {
      overriddenFeatureFlags: {
        stakePrograms: mockStakeProgramsFeature,
      },
    },
  },
});

// ❌ BAD — Don't mock useFeature or feature flag modules
jest.mock("@ledgerhq/live-common/featureFlags");
```

---

## Shared Test Data

**⚠️ ALWAYS check for existing mocks before creating new ones.**

### Existing Shared Resources (Desktop)

| Location | Purpose |
| --- | --- |
| `@ledgerhq/coin-framework/mocks/account` | `genAccount()`, `genTokenAccount()` factories |
| `@ledgerhq/live-common/currencies` | `getCryptoCurrencyById()`, `getTokenById()` |
| `tests/handlers/` | MSW handlers (market, assets, countervalues, cryptoIcons) |
| `tests/handlers/fixtures/` | JSON fixtures for API responses |
| `tests/fixtures/wallet-api.ts` | `mockedAccountList`, `expectedCurrencyList` |
| `tests/mocks/countervalues.mock.ts` | `initialCountervaluesMock` |
| `tests/mocks/` | Mock components and assets |

### Reusing Accounts & Currencies

```typescript
// ✅ GOOD — Use existing factories
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";

const mockAccount = genAccount("my_test_account");
const bitcoin = getCryptoCurrencyById("bitcoin");

// ✅ GOOD — Extend with overrides only when needed
export const createMockAccount = (overrides?: Partial<Account>): Account => ({
  ...genAccount("mock_account"),
  id: "mock_account_id",
  currency: getCryptoCurrencyById("bitcoin"),
  ...overrides,
});

// ❌ BAD — Don't recreate currency/account data from scratch
const bitcoin = {
  id: "bitcoin",
  name: "Bitcoin",
  ticker: "BTC",
  // ... duplicating what getCryptoCurrencyById already provides
};
```

### Reusing API Handlers

```typescript
// ✅ GOOD — Import from shared handlers
import handlers from "tests/handlers";
import { server } from "tests/server";

// handlers already includes: market, assets, countervalues, cryptoIcons, fearAndGreed

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Override only when needed for specific test cases
server.use(
  http.get("/api/custom", () => HttpResponse.json({ custom: "data" }))
);
```

### Before Creating New Mocks

1. **Search existing mocks first:**

```bash
# Check for existing account factories
rg "genAccount|createMockAccount|mockAccount" libs/ tests/ src/

# Check for existing currency data
rg "getCryptoCurrencyById|mockCurrency" tests/ src/

# Check for existing API handlers
ls tests/handlers/
```

2. **Add to shared location if reusable:**

```typescript
// tests/handlers/myDomain.ts — For new reusable handlers
import { http, HttpResponse } from "msw";
import myFixture from "./fixtures/myDomain/data.json";

export default [
  http.get("/api/my-endpoint", () => HttpResponse.json(myFixture)),
];

// Then register in tests/handlers/index.ts
import MyDomainHandlers from "./myDomain";
export default [...MyDomainHandlers, ...otherHandlers];
```

---

## Workflow

```
1. Write test → 2. Run test → 3. Fix if fail → 4. Next file
```

**Order by complexity:**

1. 🟢 Utils/helpers
2. 🟢 Hooks
3. 🟡 Simple components
4. 🔴 Complex components (API, navigation)

---

## Don'ts

- ❌ Don't mock feature flags — Use `overriddenFeatureFlags` in settings
- ❌ Don't recreate accounts — Use `genAccount()` from `@ledgerhq/coin-framework/mocks/account`
- ❌ Don't recreate currencies — Use `getCryptoCurrencyById()` from `@ledgerhq/live-common/currencies`
- ❌ Don't duplicate API handlers — Check `tests/handlers/` first
- ❌ Don't mock child components (test integration)
- ❌ Don't test implementation details
- ❌ Don't use hardcoded unrealistic values
- ❌ Don't write flaky tests (use `waitFor` for async)
