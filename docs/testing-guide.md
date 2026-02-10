# Ledger Live - Testing Guide

> **Generated:** 2026-01-23 | **Scan Level:** Exhaustive

## Overview

This guide outlines the testing requirements and patterns for the Ledger Live monorepo. Different parts of the codebase have specific testing expectations.

---

## Testing Requirements by Area

| Area | Unit Test Coverage | Integration Tests | E2E Tests |
|------|-------------------|-------------------|-----------|
| **Coin Modules** | 100% | Required for each `api/` method | Coin Tester |
| **Mobile App** | Component unit tests | Feature integration tests | Detox |
| **Desktop App** | Component unit tests | Feature integration tests | Playwright |
| **Other Libraries** | 100% | When applicable | - |

---

## Coin Modules Testing

### Requirements

1. **100% unit test coverage** for all logic
2. **Integration test for each method** in the `api/` folder
3. **Coin Tester implementation** (when possible)

### Unit Tests

Co-locate unit tests with source files:

```
coin-{name}/src/
├── logic/
│   ├── validateAddress.ts
│   └── validateAddress.test.ts        # Unit test
├── network/
│   ├── index.ts
│   └── index.test.ts                  # Unit test (mocked network)
```

```typescript
// libs/coin-modules/coin-{name}/src/logic/validateAddress.test.ts
import { validateAddress } from "./validateAddress";

describe("validateAddress", () => {
  it("should return true for valid address", () => {
    expect(validateAddress("valid-address")).toBe(true);
  });

  it("should return false for invalid address", () => {
    expect(validateAddress("invalid")).toBe(false);
  });
});
```

### API Integration Tests

Every method in `api/` must have an integration test:

```
coin-{name}/src/
├── api/
│   ├── index.ts
│   ├── index.test.ts                  # Unit tests (mocked)
│   └── index.integ.test.ts            # Integration tests (real network)
```

```typescript
// libs/coin-modules/coin-tron/src/api/index.integ.test.ts
import { getBalance, getTransactions } from "./index";

describe("Tron API Integration", () => {
  it("should fetch balance for valid address", async () => {
    const balance = await getBalance("TAddress...");
    expect(typeof balance).toBe("bigint");
  });

  it("should fetch transactions", async () => {
    const txs = await getTransactions("TAddress...");
    expect(Array.isArray(txs)).toBe(true);
  });
});
```

**Run integration tests:**
```bash
pnpm coin:{name} test-integ
```

### Coin Tester

The coin tester provides deterministic end-to-end testing with local test nodes.

**What is Coin Tester?**
- Executes transaction **scenarios** against a local test node
- Tests the full coin module capabilities
- Deterministic and reproducible

**Scenario Example:**
```
> Send 1 ETH to Alice
> Send 1 NFT to Bob
> Stake 100 ETH to staking pool
```

**Prerequisites:**
- Docker installed
- Coin module with `setConfiguration`/`getConfiguration`
- Local test node setup

**Available Coin Testers:**

| Coin | Command |
|------|---------|
| EVM | `pnpm coin:tester:evm start` |
| Bitcoin | `pnpm coin:tester:bitcoin start` |
| Polkadot | `pnpm coin:tester:polkadot start` |
| Solana | `pnpm coin:tester:solana start` |

**Implementation Location:**
- Engine: `libs/coin-tester/src/main.ts`
- Modules: `libs/coin-tester-modules/coin-tester-{name}/`

**Documentation:** See `libs/coin-tester/coin-tester.md`

---

## Mobile App Testing

### Requirements

1. **Component unit tests** for all components
2. **Feature integration tests** in `__integrations__/` folders

### Component Unit Tests

```typescript
// src/components/MyComponent/MyComponent.test.tsx
import { render } from "@tests/test-renderer";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    const { getByText } = render(<MyComponent title="Hello" />);
    expect(getByText("Hello")).toBeOnTheScreen();
  });
});
```

### Feature Integration Tests

Located in `__integrations__/` folders within each feature:

```
src/mvvm/features/Market/
├── __integrations__/
│   ├── shared.tsx                           # Shared test setup
│   └── searchACoin.integration.test.tsx     # Integration test
├── components/
├── screens/
└── hooks/
```

**Example Integration Test:**

```typescript
// apps/ledger-live-mobile/src/mvvm/features/Market/__integrations__/searchACoin.integration.test.tsx
import * as React from "react";
import { screen, waitForElementToBeRemoved, renderWithReactQuery } from "@tests/test-renderer";
import { MarketPages } from "./shared";

describe("Market integration test", () => {
  it("Should search for a coin and navigate to detail page", async () => {
    const { user } = renderWithReactQuery(<MarketPages />);

    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();
    expect(await screen.findByText("Ethereum (ETH)")).toBeOnTheScreen();

    const searchInput = await screen.findByPlaceholderText("Search");
    await user.type(searchInput, "BTC");

    await waitForElementToBeRemoved(() => screen.queryByText("Ethereum (ETH)"));

    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();

    await user.press(screen.getByText("Bitcoin (BTC)"));

    expect(await screen.findByText("Price Statistics")).toBeOnTheScreen();
  });
});
```

### Test Utilities

**Custom Test Renderer:** `@tests/test-renderer`

```typescript
import { render, renderWithReactQuery } from "@tests/test-renderer";

// Basic render
const { getByText } = render(<Component />);

// With React Query provider
const { user } = renderWithReactQuery(<Component />);
```

**MSW for Network Mocking:** `apps/ledger-live-mobile/__tests__/server.ts`

### Running Mobile Tests

```bash
# All Jest tests
pnpm mobile test:jest

# With coverage
pnpm mobile test:jest:coverage

# Specific file
pnpm mobile test:jest "searchACoin"

# Detox E2E
pnpm mobile e2e:test
```

---

## Desktop App Testing

### Requirements

1. **Component unit tests** for all components
2. **Feature integration tests** for MVVM features

### Component Unit Tests

```typescript
// src/renderer/components/MyComponent/MyComponent.test.tsx
import { render } from "tests/testSetup";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText("Expected Text")).toBeInTheDocument();
  });
});
```

### Feature Integration Tests

```
src/mvvm/features/Send/
├── __integrations__/                   # Feature integration tests
├── screens/
│   └── Recipient/
│       └── hooks/
│           └── __tests__/              # Hook unit tests
└── components/
```

### Test Utilities

**Test Setup:** `tests/testSetup`

```typescript
import { render } from "tests/testSetup";
```

**MSW for Network Mocking:** `apps/ledger-live-desktop/tests/server.ts`

### Running Desktop Tests

```bash
# Jest unit tests
pnpm desktop test:jest

# With coverage
pnpm desktop test:jest:coverage

# Playwright E2E
pnpm desktop test:playwright

# Playwright smoke tests
pnpm desktop test:playwright:smoke
```

---

## Other Libraries Testing

### Requirements

1. **100% unit test coverage**
2. **Integration tests** when it makes sense

### Examples

**ledger-live-common:**
```bash
pnpm common test
pnpm common ci-test-unit
pnpm common ci-test-integration
```

**ledgerjs packages:**
```bash
pnpm ljs:hw-app-btc test
pnpm ljs:hw-app-eth test
```

**UI packages:**
```bash
pnpm ui:react test
pnpm ui:native test
```

---

## Testing Patterns

### Query Priority (Testing Library)

Follow this priority for selecting elements:

1. `getByRole` - Accessible roles
2. `getByLabelText` - Form labels
3. `getByText` - Visible text
4. `getByTestId` - Last resort

### Mocking Network with MSW

```typescript
// Setup handlers
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/assets", () => {
    return HttpResponse.json([
      { id: "bitcoin", name: "Bitcoin" },
      { id: "ethereum", name: "Ethereum" },
    ]);
  }),
];

// In test
import { server } from "@tests/server";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Async Testing

```typescript
import { waitFor } from "@testing-library/react";

// Wait for element
await waitFor(() => {
  expect(screen.getByText("Loaded")).toBeInTheDocument();
});

// Wait for element to disappear
await waitForElementToBeRemoved(() => screen.queryByText("Loading"));
```

### Testing Redux

```typescript
import { render } from "tests/testSetup";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

const store = configureStore({
  reducer: rootReducer,
  preloadedState: {
    accounts: mockAccounts,
  },
});

render(
  <Provider store={store}>
    <Component />
  </Provider>
);
```

---

## Test File Naming

| Type | Pattern | Location |
|------|---------|----------|
| Unit Test | `*.test.ts(x)` | Next to source file |
| Integration Test | `*.integ.test.ts(x)` | `api/` folder or `__integrations__/` |
| E2E Test | `*.spec.ts` | `e2e/` folder |

---

## Coverage Reports

### Coin Modules

```bash
pnpm coin:coverage           # All coin modules
pnpm coin:coverage:clean     # Clean coverage files
```

### Desktop

```bash
pnpm desktop test:jest:coverage
```

### Mobile

```bash
pnpm mobile test:jest:coverage
```

---

## CI Testing Workflows

| Workflow | Purpose |
|----------|---------|
| `test-libs-reusable.yml` | Library unit tests |
| `test-desktop-reusable.yml` | Desktop tests |
| `test-mobile-reusable.yml` | Mobile tests |
| `test-coin-modules-integ.yml` | Coin integration tests |
| `test-coin-tester.yml` | Coin tester runs |
| `bot-testing-*.yml` | Automated bot testing |
