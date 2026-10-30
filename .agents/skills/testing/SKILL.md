---
name: testing
description: |
  Write unit and integration tests for the Ledger Wallet apps and for packages in the layers
  (`shared/`, `domain/`, `features/`, `devtools/`): Jest with React Testing Library, `@support/jest`
  presets, MSW handlers and testing best practices.
  Integration tests fake HTTP with MSW `jest.fn()` endpoint mocks instead of `jest.mock`-ing modules.
  Use when writing or reviewing "*.test.*", "*.spec.*", "**/tests/**", "**/__tests__/**",
  "**/__integrations__/**", "**/jest-setup*" or a package's `jest.config.js`.
---

# Ledger Wallet Testing Skill

> Jest + MSW + React Testing Library (Desktop) / React Native Testing Library (Mobile)
> ❌ E2E tests → Use `e2e-desktop-add-or-update` / `e2e-mobile-add-or-update` skills
> ⚠️ A new desktop flow needs Jest tests **and** an `e2e/desktop` spec. `apps/ledger-live-desktop/tests/specs` (mocked Playwright) is frozen: fix, update or delete, never add a spec file or test case.

## Golden Rules

1. **`toBeVisible()` over `toBeInTheDocument()`** — Always. `toBeInTheDocument` only checks DOM presence; elements can be hidden. Use `toBeInTheDocument` only when testing explicitly hidden elements.
2. **Search before you create** — Before writing any mock, fixture, or helper, `rg` the codebase. If it exists, import it. If your new mock is reusable (2+ files), put it in a shared location.
3. **Fake the network, not modules** — Integration tests run the real store, API clients and SDKs, and intercept HTTP with MSW [endpoint mocks](references/msw-endpoints.md). `jest.mock` only what cannot run under Jest (native modules, device transport). Never mock child components.
4. **Network requests via MSW, never `fetch`** — New test code must not mock `fetch`; use Mock Service Worker handlers instead.
5. **One behavior per test** — Name: `it("should <behavior> when <condition>")`.
6. **Query priority**: `getByRole` > `getByLabelText` > `getByText` > `getByTestId` (last resort).
7. **Feature flags via store, never mocked**: `withFlagOverrides()` sets `state.featureFlags.overrides`.
8. **Use existing factories** — `genAccount()` from `@ledgerhq/ledger-wallet-framework/mocks/account`, `getCryptoCurrencyById()` from `@ledgerhq/live-common/currencies`. Never recreate account/currency data from scratch.

## Quick Reference

```bash
pnpm test:jest "filename"    # Run specific file
pnpm test:jest               # Run all tests
pnpm test:jest --coverage    # Coverage report

# Packages in the layers
pnpm nx run <package-name>:test

# Coin modules (libs/coin-modules)
pnpm coin:<name> test              # Unit tests
pnpm coin:<name> test "filename"   # Specific file
pnpm coin:<name> test-integ        # Integration tests (slow)
```

| Platform | Render Import          | MSW Server            |
| -------- | ---------------------- | --------------------- |
| Desktop  | `tests/testSetup`      | `tests/server.ts`     |
| Mobile   | `@tests/test-renderer` | `__tests__/server.ts` |

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

## Testing Hooks

```typescript
import { renderHook, act, waitFor } from "tests/testSetup";

const { result } = renderHook(() => useMyHook());
await act(async () => result.current.increment());
expect(result.current.value).toBe(1);
```

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

**Feature flags**: local overrides live in `state.featureFlags.overrides`, and `useFeature` reads
`state.featureFlags.resolved`. `withFlagOverrides` (exported by both test renderers) fills both,
merged over the flag's defaults:

```typescript
// Desktop: import { render, withFlagOverrides } from "tests/testSetup";
render(<MyComponent />, {
  initialState: withFlagOverrides({ myFlag: { enabled: true, params: { key: "value" } } }),
});

// Mobile: import { render, withFlagOverrides } from "@tests/test-renderer";
render(<MyScreen />, {
  overrideInitialState: withFlagOverrides({ myFlag: { enabled: true } }),
});
```

## Mocking Patterns

What to `jest.mock` and when, the shared app mocks to search first, and the anti-patterns that make
parallel runs flaky: [references/mocks.md](references/mocks.md).

## Packages in the Layers

Packages under `shared/`, `domain/`, `features/` and `devtools/` have no app harness. Each one:

- builds its `jest.config.js` from a `@support/jest` preset (`shared`, `features-flow`, `devtools`,
  `libs-coin`) with the default call: `createSharedJestConfig({ rootDir: __dirname })` for node
  code, `createFlowJestConfig()` for a flow. Options and overrides: `support/jest/README.md`.
- splits UI tests into a `web` and a `native` jest project by suffix: `X.web.test.tsx`,
  `X.native.test.tsx`.
- keeps tests next to the code in `src/`, and mock factories in `*.mock.ts` out of the barrel.
- fakes its endpoints with the MSW handlers its `domain/api/*` package ships
  (`@domain/api-card-management/mock/card-api`).

Presets, projects, layout and domain handlers: [references/packages.md](references/packages.md).

## Workflow

```
1. Search for existing mocks → 2. Write test → 3. Run test → 4. Fix if fail → 5. Next file
```

Start with the simplest units (utils, hooks), then work up to components with side effects (API, navigation). This order catches foundational bugs early and builds confidence incrementally.
