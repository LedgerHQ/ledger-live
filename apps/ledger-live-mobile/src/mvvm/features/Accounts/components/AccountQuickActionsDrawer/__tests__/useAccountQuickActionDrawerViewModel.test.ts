import { renderHook } from "@tests/test-renderer";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { State } from "~/reducers/types";
import useAccountQuickActionDrawerViewModel from "../useAccountQuickActionDrawerViewModel";

const navigate = jest.fn();

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
  useNavigation: () => ({ navigate }),
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockReceiveAction = {
  icon: "ArrowDown",
  disabled: false,
};
const mockBuyAction = {
  icon: "Plus",
  disabled: false,
};

const mockUseQuickActions = jest.fn();
jest.mock("~/hooks/useQuickActions", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseQuickActions(...args),
}));

const ethCurrency = {
  type: "CryptoCurrency",
  id: "ethereum",
  ticker: "ETH",
  name: "Ethereum",
  family: "ethereum",
} as CryptoOrTokenCurrency;

const makeAccount = (id: string): Account =>
  ({
    type: "Account",
    id,
    currency: ethCurrency,
  }) as unknown as Account;

const makeTokenAccount = (id: string, parentId: string): TokenAccount =>
  ({
    type: "TokenAccount",
    id,
    parentId,
    token: ethCurrency,
  }) as unknown as TokenAccount;

describe("useAccountQuickActionDrawerViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuickActions.mockReturnValue({
      quickActionsList: { RECEIVE: mockReceiveAction, BUY: mockBuyAction },
    });
  });

  it("should build Receive and Buy actions when both are available", () => {
    const { result } = renderHook(() =>
      useAccountQuickActionDrawerViewModel({
        currency: ethCurrency,
        account: makeAccount("eth-1"),
      }),
    );

    expect(result.current.actions).toHaveLength(2);
    expect(result.current.actions[0].testID).toBe("action-drawer-receive-button");
    expect(result.current.actions[1].testID).toBe("action-drawer--buy-button");
  });

  it("should use account.id for Receive navigation when Account type", () => {
    const account = makeAccount("eth-1");
    const { result } = renderHook(() =>
      useAccountQuickActionDrawerViewModel({
        currency: ethCurrency,
        account,
      }),
    );

    result.current.actions[0].onPress?.();

    expect(navigate).toHaveBeenCalledWith(
      "ReceiveFunds",
      expect.objectContaining({
        params: expect.objectContaining({ accountId: "eth-1" }),
      }),
    );
  });

  it("should use account.parentId for Receive navigation when TokenAccount", () => {
    const tokenAccount = makeTokenAccount("token-1", "eth-parent-1");
    const { result } = renderHook(() =>
      useAccountQuickActionDrawerViewModel({
        currency: ethCurrency,
        account: tokenAccount,
      }),
    );

    result.current.actions[0].onPress?.();

    expect(navigate).toHaveBeenCalledWith(
      "ReceiveFunds",
      expect.objectContaining({
        params: expect.objectContaining({ accountId: "eth-parent-1" }),
      }),
    );
  });

  it("should use noah description variant when noah flag enabled", () => {
    const { resultWithoutNoah } = (() => {
      const { result } = renderHook(() =>
        useAccountQuickActionDrawerViewModel({
          currency: ethCurrency,
          account: makeAccount("eth-1"),
        }),
      );
      return { resultWithoutNoah: result };
    })();

    const descriptionWithoutNoah = resultWithoutNoah.current.actions[0].description;

    const { result } = renderHook(
      () =>
        useAccountQuickActionDrawerViewModel({
          currency: ethCurrency,
          account: makeAccount("eth-1"),
        }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              noah: { enabled: true },
            },
          },
        }),
      },
    );

    expect(result.current.actions[0].description).not.toBe(descriptionWithoutNoah);
  });

  it("should filter out undefined actions when RECEIVE is unavailable", () => {
    mockUseQuickActions.mockReturnValue({
      quickActionsList: { RECEIVE: undefined, BUY: mockBuyAction },
    });

    const { result } = renderHook(() =>
      useAccountQuickActionDrawerViewModel({
        currency: ethCurrency,
        account: makeAccount("eth-1"),
      }),
    );

    expect(result.current.actions).toHaveLength(1);
    expect(result.current.actions[0].testID).toBe("action-drawer--buy-button");
  });

  it("should navigate to Exchange for Buy action", () => {
    const account = makeAccount("eth-1");
    const { result } = renderHook(() =>
      useAccountQuickActionDrawerViewModel({
        currency: ethCurrency,
        account,
      }),
    );

    result.current.actions[1].onPress?.();

    expect(navigate).toHaveBeenCalledWith(
      "Exchange",
      expect.objectContaining({
        screen: "ExchangeBuy",
        params: expect.objectContaining({
          defaultAccountId: "eth-1",
          defaultCurrencyId: "ethereum",
        }),
      }),
    );
  });
});
