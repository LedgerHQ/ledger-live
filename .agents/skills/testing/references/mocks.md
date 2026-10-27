# Mocks: when to use them, where to find them, how not to break them

## Mocking patterns

```typescript
// HTTP: override an endpoint mock, never jest.mock the client (see msw-endpoints.md)
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

## Shared app resources: search here first

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

New reusable mocks go in `tests/mocks/`, new handlers in `tests/handlers/`, new fixtures in
`tests/handlers/fixtures/`. In a package, mocks and handlers follow [packages.md](packages.md).

## Mock anti-patterns

These cause flaky tests and mock cannibalization when running with parallel workers (`--maxWorkers=50%`).

**Duplicate mocks**: Don't `jest.mock("module")` in a test file when it's already mocked in jest-setup (`apps/ledger-live-mobile/__tests__/jest-setup.js` or `apps/ledger-live-desktop/tests/jestSetup.js`). Use `jest.mocked(module.export).mockReturnValue(...)` in `beforeEach` instead.

**Hooks at describe load time**: Never call `renderHook(...)` or access `.result.current` at the top level of a `describe` block. Move into `beforeEach` or inside each test: calling hooks outside of test callbacks crashes Jest parallel workers.

**`jest.restoreAllMocks()`**: Never use this; it restores global mocks from jest-setup and breaks other tests. Use `jest.clearAllMocks()` or `mock.mockRestore()` for specific spies only.

**Wrong `beforeEach` order**: Call `jest.clearAllMocks()` _before_ `mockReturnValue()` or other mock configuration, not after (calling clear after wipes the setup).
