import { act, renderHook } from "@tests/test-renderer";
import { useOpenSwap } from "../index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { Account } from "@ledgerhq/types-live";
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

  describe("wallet 4.0 navigation", () => {
    test("should navigate via Main → Swap when account for currency exists", () => {
      const account = createBitcoinAccount("account-1");
      const { result } = renderHook(
        () => useOpenSwap({ currency: bitcoin, sourceScreenName: SOURCE_SCREEN }),
        {
          overrideInitialState: state => ({
            ...state,
            accounts: { ...state.accounts, active: [account] },
          }),
        },
      );

      act(() => {
        result.current.handleOpenSwap();
      });

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Main, {
        screen: NavigatorName.Swap,
        params: {
          screen: ScreenName.SwapTab,
          params: expect.objectContaining({
            defaultCurrency: bitcoin,
            fromPath: SOURCE_SCREEN,
            defaultAccount: account,
            defaultParentAccount: undefined,
          }),
        },
      });
      expect(mockOpenDrawer).not.toHaveBeenCalled();
    });

    test("should navigate via Main → Swap when no account for currency", () => {
      const { result } = renderHook(
        () => useOpenSwap({ currency: bitcoin, sourceScreenName: SOURCE_SCREEN }),
        {
          overrideInitialState: state => ({
            ...state,
            accounts: { ...state.accounts, active: [] },
          }),
        },
      );

      act(() => {
        result.current.handleOpenSwap();
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Main, {
        screen: NavigatorName.Swap,
        params: {
          screen: ScreenName.SwapTab,
          params: expect.objectContaining({
            defaultCurrency: bitcoin,
            fromPath: SOURCE_SCREEN,
          }),
        },
      });
      expect(mockNavigate.mock.calls[0][1].params.params.defaultAccount).toBeUndefined();
      expect(mockOpenDrawer).not.toHaveBeenCalled();
    });

    test("should navigate via Main → Swap with toTokenId when no account for token", () => {
      const { result } = renderHook(
        () => useOpenSwap({ currency: usdcToken, sourceScreenName: SOURCE_SCREEN }),
        {
          overrideInitialState: state => ({
            ...state,
            accounts: { ...state.accounts, active: [] },
          }),
        },
      );

      act(() => {
        result.current.handleOpenSwap();
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Main, {
        screen: NavigatorName.Swap,
        params: {
          screen: ScreenName.SwapTab,
          params: expect.objectContaining({
            defaultCurrency: usdcToken,
            fromPath: SOURCE_SCREEN,
            toTokenId: usdcToken.id,
          }),
        },
      });
      expect(mockOpenDrawer).not.toHaveBeenCalled();
    });

    test("should open drawer for account selection when multiple accounts (no direct nav)", () => {
      const account1 = createBitcoinAccount("btc-1");
      const account2 = createBitcoinAccount("btc-2");
      const { result } = renderHook(
        () => useOpenSwap({ currency: bitcoin, sourceScreenName: SOURCE_SCREEN }),
        {
          overrideInitialState: state => ({
            ...state,
            accounts: { ...state.accounts, active: [account1, account2] },
          }),
        },
      );

      act(() => {
        result.current.handleOpenSwap();
      });

      expect(mockOpenDrawer).toHaveBeenCalledTimes(1);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
