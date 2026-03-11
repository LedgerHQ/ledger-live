import { renderHook, act } from "@tests/test-renderer";
import { Account } from "@ledgerhq/types-live";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { State } from "~/reducers/types";
import useAddFundsButtonViewModel from "../useAddFundsButtonViewModel";

const navigate = jest.fn();
const getParent = jest.fn();

jest.mock("~/analytics", () => ({ track: jest.fn() }));

jest.mock("@react-navigation/native", () => {
  const React = require("react");
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useNavigationIndependentTree: actual.useNavigationIndependentTree || (() => ({})),
  };
});

jest.mock("@react-navigation/core", () => ({
  useNavigation: () => ({
    navigate,
    getParent,
  }),
}));

const mockAnalyticsMetadata = {
  AddFunds: {
    onQuickActionOpen: { eventName: "quick_action_open", payload: { source: "test" } },
    onOpenDrawer: { eventName: "open_drawer", payload: { source: "test" } },
    onCloseDrawer: { eventName: "close_drawer", payload: { source: "test" } },
    onSelectAccount: { eventName: "select_account", payload: { source: "test" } },
    onQuickActionClose: { eventName: "quick_action_close", payload: { source: "test" } },
  },
};

jest.mock("LLM/hooks/useAnalytics", () => ({
  __esModule: true,
  default: () => ({ analyticsMetadata: mockAnalyticsMetadata }),
}));

const makeAccount = (id: string): Account =>
  ({
    type: "Account",
    id,
    currency: { type: "CryptoCurrency", id: "ethereum", ticker: "ETH", name: "Ethereum" },
  }) as unknown as Account;

const ethCurrency = {
  type: "CryptoCurrency",
  id: "ethereum",
  ticker: "ETH",
  name: "Ethereum",
} as CryptoOrTokenCurrency;

const stateWithFeatureFlag = (enabled: boolean) => ({
  overrideInitialState: (state: State) => ({
    ...state,
    settings: {
      ...state.settings,
      overriddenFeatureFlags: {
        llmSyncOnboardingIncr1: { enabled },
      },
    },
  }),
});

describe("useAddFundsButtonViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getParent.mockReturnValue({
      getState: () => ({ routeNames: ["Main"] }),
    });
  });

  it("should initialize selectedAccount to the single account when accounts.length === 1", () => {
    const account = makeAccount("eth-1");
    const { result } = renderHook(() =>
      useAddFundsButtonViewModel({
        accounts: [account],
        currency: ethCurrency,
        sourceScreenName: "test",
      }),
    );

    expect(result.current.selectedAccount).toEqual(account);
  });

  it("should initialize selectedAccount to null when multiple accounts", () => {
    const { result } = renderHook(() =>
      useAddFundsButtonViewModel({
        accounts: [makeAccount("eth-1"), makeAccount("eth-2")],
        currency: ethCurrency,
        sourceScreenName: "test",
      }),
    );

    expect(result.current.selectedAccount).toBeNull();
  });

  it("should open quick actions drawer directly when 1 account", () => {
    const { result } = renderHook(() =>
      useAddFundsButtonViewModel({
        accounts: [makeAccount("eth-1")],
        currency: ethCurrency,
        sourceScreenName: "test",
      }),
    );

    act(() => result.current.openFundOrAccountListDrawer());

    expect(result.current.isAccountQuickActionsDrawerOpen).toBe(true);
    expect(result.current.isAccountListDrawerOpen).toBe(false);
  });

  it("should open account list drawer when multiple accounts", () => {
    const { result } = renderHook(() =>
      useAddFundsButtonViewModel({
        accounts: [makeAccount("eth-1"), makeAccount("eth-2")],
        currency: ethCurrency,
        sourceScreenName: "test",
      }),
    );

    act(() => result.current.openFundOrAccountListDrawer());

    expect(result.current.isAccountListDrawerOpen).toBe(true);
    expect(result.current.isAccountQuickActionsDrawerOpen).toBe(false);
  });

  it("should redirect to ReceiveConfirmation during onboarding flow when flag enabled", () => {
    getParent.mockReturnValue({
      getState: () => ({ routeNames: ["Onboarding"] }),
    });

    const account = makeAccount("eth-1");
    const { result } = renderHook(
      () =>
        useAddFundsButtonViewModel({
          accounts: [account],
          currency: ethCurrency,
          sourceScreenName: "test",
        }),
      stateWithFeatureFlag(true),
    );

    act(() => result.current.openFundOrAccountListDrawer());

    expect(navigate).toHaveBeenCalledWith(
      "ReceiveFunds",
      expect.objectContaining({
        screen: "ReceiveConfirmation",
        params: expect.objectContaining({
          accountId: "eth-1",
        }),
      }),
    );
  });

  it("should close account list drawer", () => {
    const { result } = renderHook(() =>
      useAddFundsButtonViewModel({
        accounts: [makeAccount("eth-1"), makeAccount("eth-2")],
        currency: ethCurrency,
        sourceScreenName: "test",
      }),
    );

    act(() => result.current.openFundOrAccountListDrawer());
    expect(result.current.isAccountListDrawerOpen).toBe(true);

    act(() => result.current.closeAccountListDrawer());
    expect(result.current.isAccountListDrawerOpen).toBe(false);
  });

  it("should select account from list, close list drawer, open quick actions", () => {
    const account2 = makeAccount("eth-2");

    const { result } = renderHook(() =>
      useAddFundsButtonViewModel({
        accounts: [makeAccount("eth-1"), account2],
        currency: ethCurrency,
        sourceScreenName: "test",
      }),
    );

    act(() => result.current.handleOnSelectAccount(account2));

    expect(result.current.isAccountListDrawerOpen).toBe(false);
    expect(result.current.isAccountQuickActionsDrawerOpen).toBe(true);
    expect(result.current.selectedAccount).toEqual(account2);
  });

  it("should close quick actions drawer", () => {
    const { result } = renderHook(() =>
      useAddFundsButtonViewModel({
        accounts: [makeAccount("eth-1")],
        currency: ethCurrency,
        sourceScreenName: "test",
      }),
    );

    act(() => result.current.openFundOrAccountListDrawer());
    expect(result.current.isAccountQuickActionsDrawerOpen).toBe(true);

    act(() => result.current.handleOnCloseQuickActions());
    expect(result.current.isAccountQuickActionsDrawerOpen).toBe(false);
  });
});
