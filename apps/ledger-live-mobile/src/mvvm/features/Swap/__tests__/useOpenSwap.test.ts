import { act, renderHook } from "@tests/test-renderer";
import { useOpenSwap } from "../index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { makeEmptyTokenAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
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
const ethereum = getCryptoCurrencyById("ethereum");

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

    describe("account picked in the drawer for a token the user doesn't hold", () => {
      const openDrawerAndSelect = (
        select: (params: { onAccountSelected: (a: unknown, p?: unknown) => void }) => void,
        accounts: Account[],
      ) => {
        const { result } = renderHook(
          () =>
            useOpenSwap({
              currency: usdcToken,
              currencyIds: [usdcToken.id, "arbitrum/erc20/usd__coin"],
              sourceScreenName: SOURCE_SCREEN,
            }),
          {
            overrideInitialState: state => ({
              ...state,
              accounts: { ...state.accounts, active: accounts },
            }),
          },
        );

        act(() => {
          result.current.handleOpenSwap();
        });

        expect(mockOpenDrawer).toHaveBeenCalledTimes(1);
        select(mockOpenDrawer.mock.calls[0][0]);
      };

      test("should hand the parent account and the token to Swap for an empty token account", () => {
        const parent = { ...genAccount("eth-1", { currency: ethereum }), id: "js:2:ethereum:0x1:" };
        const emptyTokenAccount = makeEmptyTokenAccount(parent, usdcToken);

        openDrawerAndSelect(
          params => act(() => params.onAccountSelected(emptyTokenAccount, parent)),
          [parent],
        );

        const swapParams = mockNavigate.mock.calls[0][1].params.params;
        expect(swapParams.defaultAccount).toBe(parent);
        expect(swapParams.defaultCurrency).toBe(usdcToken);
        expect(swapParams.fromPath).toBe(SOURCE_SCREEN);
      });

      test("should resolve the parent from the store when the drawer doesn't provide it", () => {
        const parent = { ...genAccount("eth-2", { currency: ethereum }), id: "js:2:ethereum:0x2:" };
        const emptyTokenAccount = makeEmptyTokenAccount(parent, usdcToken);

        openDrawerAndSelect(
          params => act(() => params.onAccountSelected(emptyTokenAccount)),
          [parent],
        );

        const swapParams = mockNavigate.mock.calls[0][1].params.params;
        expect(swapParams.defaultAccount).toBe(parent);
        expect(swapParams.defaultCurrency).toBe(usdcToken);
      });

      test("should fall back to toTokenId when the parent account can't be resolved", () => {
        const parent = { ...genAccount("eth-3", { currency: ethereum }), id: "js:2:ethereum:0x3:" };
        const emptyTokenAccount = makeEmptyTokenAccount(parent, usdcToken);

        openDrawerAndSelect(params => act(() => params.onAccountSelected(emptyTokenAccount)), []);

        const swapParams = mockNavigate.mock.calls[0][1].params.params;
        expect(swapParams.defaultAccount).toBeUndefined();
        expect(swapParams.toTokenId).toBe(usdcToken.id);
      });
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
