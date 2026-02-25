import { act, renderHook } from "@tests/test-renderer";
import { useOpenSwap } from "../index";
import { genAccount, genTokenAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { Account } from "@ledgerhq/types-live";
import { State } from "~/reducers/types";
import { NavigatorName, ScreenName } from "~/const";

const SOURCE_SCREEN = "Market";

const mockNavigate = jest.fn();
const mockOpenDrawer = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("../../ModularDrawer", () => ({
  useModularDrawerController: () => ({ openDrawer: mockOpenDrawer }),
}));

const bitcoin = getCryptoCurrencyById("bitcoin");

function createBitcoinAccount(id: string): Account {
  const account = genAccount(id, { currency: bitcoin });
  return { ...account, id: `mock:1:bitcoin:${id}:` };
}

describe("useOpenSwap (Market / QuickActions origin)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should navigate to swap with toAccountId (defaultAccount) when account for currency exists", () => {
    const account = createBitcoinAccount("account-1");
    const { result } = renderHook(
      () => useOpenSwap({ currency: bitcoin, sourceScreenName: SOURCE_SCREEN }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: { ...state.accounts, active: [account] },
        }),
      },
    );

    act(() => {
      result.current.handleOpenSwap();
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Swap, {
      screen: ScreenName.SwapTab,
      params: expect.objectContaining({
        defaultCurrency: bitcoin,
        fromPath: SOURCE_SCREEN,
        defaultAccount: account,
        defaultParentAccount: undefined,
      }),
    });
    expect(mockOpenDrawer).not.toHaveBeenCalled();
  });

  test("should navigate to swap with tokenId and toAccountId when account for token exists", () => {
    const ethereum = getCryptoCurrencyById("ethereum");
    const ethAccount = genAccount("eth-1", { currency: ethereum });
    const tokenAccount = genTokenAccount(0, ethAccount, usdcToken);
    ethAccount.subAccounts = [tokenAccount];

    const { result } = renderHook(
      () => useOpenSwap({ currency: usdcToken, sourceScreenName: SOURCE_SCREEN }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: { ...state.accounts, active: [ethAccount] },
        }),
      },
    );

    act(() => {
      result.current.handleOpenSwap();
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const params = mockNavigate.mock.calls[0][1].params;
    expect(params.defaultAccount).toEqual(tokenAccount);
    expect(params.defaultParentAccount).toEqual(ethAccount);
    expect(params.defaultCurrency).toEqual(usdcToken);
    expect(params.fromPath).toBe(SOURCE_SCREEN);
    expect(mockOpenDrawer).not.toHaveBeenCalled();
  });

  test("should navigate to swap webview with toTokenId only when no existing account for token", () => {
    const { result } = renderHook(
      () => useOpenSwap({ currency: usdcToken, sourceScreenName: SOURCE_SCREEN }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: { ...state.accounts, active: [] },
        }),
      },
    );

    act(() => {
      result.current.handleOpenSwap();
    });

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Swap, {
      screen: ScreenName.SwapTab,
      params: expect.objectContaining({
        defaultCurrency: usdcToken,
        fromPath: SOURCE_SCREEN,
        toTokenId: usdcToken.id,
      }),
    });
    expect(mockNavigate.mock.calls[0][1].params.defaultAccount).toBeUndefined();
    expect(mockOpenDrawer).not.toHaveBeenCalled();
  });

  test("should navigate to swap webview with defaultCurrency only when no existing account for crypto currency", () => {
    const { result } = renderHook(
      () => useOpenSwap({ currency: bitcoin, sourceScreenName: SOURCE_SCREEN }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: { ...state.accounts, active: [] },
        }),
      },
    );

    act(() => {
      result.current.handleOpenSwap();
    });

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Swap, {
      screen: ScreenName.SwapTab,
      params: expect.objectContaining({
        defaultCurrency: bitcoin,
        fromPath: SOURCE_SCREEN,
      }),
    });
    expect(mockNavigate.mock.calls[0][1].params.toTokenId).toBeUndefined();
    expect(mockNavigate.mock.calls[0][1].params.defaultAccount).toBeUndefined();
    expect(mockOpenDrawer).not.toHaveBeenCalled();
  });

  test("should auto-select account when only one account exists for currency", () => {
    const account = createBitcoinAccount("single-btc");
    const { result } = renderHook(
      () => useOpenSwap({ currency: bitcoin, sourceScreenName: SOURCE_SCREEN }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: { ...state.accounts, active: [account] },
        }),
      },
    );

    act(() => {
      result.current.handleOpenSwap();
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Swap, {
      screen: ScreenName.SwapTab,
      params: expect.objectContaining({
        defaultAccount: account,
        defaultCurrency: bitcoin,
      }),
    });
    expect(mockOpenDrawer).not.toHaveBeenCalled();
  });

  test("should open drawer for account selection when more than one account exists for currency", () => {
    const account1 = createBitcoinAccount("btc-1");
    const account2 = createBitcoinAccount("btc-2");
    const { result } = renderHook(
      () => useOpenSwap({ currency: bitcoin, sourceScreenName: SOURCE_SCREEN }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: { ...state.accounts, active: [account1, account2] },
        }),
      },
    );

    act(() => {
      result.current.handleOpenSwap();
    });

    expect(mockOpenDrawer).toHaveBeenCalledTimes(1);
    expect(mockOpenDrawer).toHaveBeenCalledWith(
      expect.objectContaining({
        currencies: [bitcoin.id],
        flow: "swap",
        source: SOURCE_SCREEN,
        areCurrenciesFiltered: true,
        enableAccountSelection: true,
      }),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
