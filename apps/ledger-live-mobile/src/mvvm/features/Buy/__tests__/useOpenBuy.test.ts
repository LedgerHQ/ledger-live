import { act, renderHook } from "@tests/test-renderer";
import { useOpenBuy } from "../index";
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

describe("useOpenBuy (Market / QuickActions origin)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should navigate to exchange buy with defaultAccountId when account for currency exists", () => {
    const account = createBitcoinAccount("account-1");
    const { result } = renderHook(
      () => useOpenBuy({ currency: bitcoin, sourceScreenName: SOURCE_SCREEN }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: { ...state.accounts, active: [account] },
        }),
      },
    );

    act(() => {
      result.current.handleOpenBuy();
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Exchange, {
      screen: ScreenName.ExchangeBuy,
      params: expect.objectContaining({
        defaultCurrencyId: bitcoin.id,
        defaultAccountId: account.id,
      }),
    });
    expect(mockOpenDrawer).not.toHaveBeenCalled();
  });

  test("should navigate to exchange buy with defaultAccountId and parentId when account for token exists", () => {
    const ethereum = getCryptoCurrencyById("ethereum");
    const ethAccount = genAccount("eth-1", { currency: ethereum });
    const tokenAccount = genTokenAccount(0, ethAccount, usdcToken);
    ethAccount.subAccounts = [tokenAccount];

    const { result } = renderHook(
      () => useOpenBuy({ currency: usdcToken, sourceScreenName: SOURCE_SCREEN }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: { ...state.accounts, active: [ethAccount] },
        }),
      },
    );

    act(() => {
      result.current.handleOpenBuy();
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const params = mockNavigate.mock.calls[0][1].params;
    expect(params.defaultCurrencyId).toBe(usdcToken.id);
    expect(params.defaultAccountId).toBe(tokenAccount.id);
    expect(params.parentId).toBe(ethAccount.id);
    expect(mockOpenDrawer).not.toHaveBeenCalled();
  });

  test("should navigate to exchange buy with only defaultCurrencyId when no accounts exist", () => {
    const { result } = renderHook(
      () => useOpenBuy({ currency: bitcoin, sourceScreenName: SOURCE_SCREEN }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: { ...state.accounts, active: [] },
        }),
      },
    );

    act(() => {
      result.current.handleOpenBuy();
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Exchange, {
      screen: ScreenName.ExchangeBuy,
      params: {
        defaultCurrencyId: bitcoin.id,
      },
    });
    expect(mockNavigate.mock.calls[0][1].params.defaultAccountId).toBeUndefined();
    expect(mockOpenDrawer).not.toHaveBeenCalled();
  });

  test("should navigate to exchange buy with only defaultCurrencyId when no accounts exist for token", () => {
    const { result } = renderHook(
      () => useOpenBuy({ currency: usdcToken, sourceScreenName: SOURCE_SCREEN }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: { ...state.accounts, active: [] },
        }),
      },
    );

    act(() => {
      result.current.handleOpenBuy();
    });

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Exchange, {
      screen: ScreenName.ExchangeBuy,
      params: {
        defaultCurrencyId: usdcToken.id,
      },
    });
    expect(mockNavigate.mock.calls[0][1].params.defaultAccountId).toBeUndefined();
    expect(mockNavigate.mock.calls[0][1].params.parentId).toBeUndefined();
    expect(mockOpenDrawer).not.toHaveBeenCalled();
  });

  test("should auto-select account when only one account exists for currency", () => {
    const account = createBitcoinAccount("single-btc");
    const { result } = renderHook(
      () => useOpenBuy({ currency: bitcoin, sourceScreenName: SOURCE_SCREEN }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: { ...state.accounts, active: [account] },
        }),
      },
    );

    act(() => {
      result.current.handleOpenBuy();
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Exchange, {
      screen: ScreenName.ExchangeBuy,
      params: expect.objectContaining({
        defaultCurrencyId: bitcoin.id,
        defaultAccountId: account.id,
      }),
    });
    expect(mockOpenDrawer).not.toHaveBeenCalled();
  });

  test("should open drawer for account selection when more than one account exists for currency", () => {
    const account1 = createBitcoinAccount("btc-1");
    const account2 = createBitcoinAccount("btc-2");
    const { result } = renderHook(
      () => useOpenBuy({ currency: bitcoin, sourceScreenName: SOURCE_SCREEN }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: { ...state.accounts, active: [account1, account2] },
        }),
      },
    );

    act(() => {
      result.current.handleOpenBuy();
    });

    expect(mockOpenDrawer).toHaveBeenCalledTimes(1);
    expect(mockOpenDrawer).toHaveBeenCalledWith(
      expect.objectContaining({
        currencies: [bitcoin.id],
        flow: "buy",
        source: SOURCE_SCREEN,
        areCurrenciesFiltered: true,
        enableAccountSelection: true,
      }),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
