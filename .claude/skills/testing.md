# Testing Skill

Jest + MSW + React Testing Library (Desktop) / React Native Testing Library (Mobile)
For E2E tests, use `.claude/skills/e2e.md` instead.

## Golden Rules

1. **`toBeVisible()` over `toBeInTheDocument()`** — always. Use `toBeInTheDocument` only when testing explicitly hidden elements.
2. **Search before you create** — before writing any mock, fixture, or helper, search the codebase. If it exists, import it.
3. **Mock external deps only** — never mock child components. Test integration.
4. **One behavior per test** — `it("should <behavior> when <condition>")`.
5. **Query priority**: `getByRole` > `getByLabelText` > `getByText` > `getByTestId` (last resort).
6. **Feature flags via store** — use `overriddenFeatureFlags` in `initialState.settings`, never mocked.
7. **Use existing factories** — `genAccount()` from `@ledgerhq/coin-framework/mocks/account`, `getCryptoCurrencyById()` from `@ledgerhq/live-common/currencies`.

## Quick Reference

```bash
pnpm test:jest "filename"    # Run specific file
pnpm test:jest               # Run all tests
pnpm test:jest --coverage    # Coverage report
```

| Platform | Render Import | MSW Server |
|----------|--------------|-----------|
| Desktop | `tests/testSetup` | `tests/server.ts` |
| Mobile | `@tests/test-renderer` | `__tests__/server.ts` |

## Test Template

```typescript
import { render, screen, waitFor } from "tests/testSetup";
import { server } from "tests/server";
import { http, HttpResponse } from "msw";

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

## Redux Store

**Desktop** — plain object merged with defaults:

```typescript
render(<MyComponent />, {
  initialState: {
    settings: { theme: "dark" },
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

## Shared Resources — Search Here First

| Location | What's there |
|----------|-------------|
| `@ledgerhq/coin-framework/mocks/account` | `genAccount()`, `genTokenAccount()` |
| `@ledgerhq/live-common/currencies` | `getCryptoCurrencyById()`, `getTokenById()` |
| `tests/handlers/` | MSW handlers (market, assets, countervalues, cryptoIcons) |
| `tests/handlers/fixtures/` | JSON fixtures for API responses |
| `tests/fixtures/` | `mockedAccountList`, `expectedCurrencyList` |
| `tests/mocks/` | Mock components, assets, countervalues |

## Workflow

```
1. Search for existing mocks
2. Write test
3. Run test
4. Fix if fail
5. Next file
```

Start with utils, then hooks, then components with side effects.
