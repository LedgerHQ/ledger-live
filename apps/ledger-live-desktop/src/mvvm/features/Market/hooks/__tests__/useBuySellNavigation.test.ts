import { act, renderHook } from "tests/testSetup";
import { useBuyNavigation } from "../useBuyNavigation";
import { useSellNavigation } from "../useSellNavigation";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency, CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

const mockNavigate = jest.fn();
const mockOpenAssetAndAccount = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/market" }),
}));

jest.mock("LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer", () => ({
  useOpenAssetAndAccount: () => ({ openAssetAndAccount: mockOpenAssetAndAccount }),
}));

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");
const base = getCryptoCurrencyById("base");
const arbitrum = getCryptoCurrencyById("arbitrum");
const multiNetworkCurrencyIds = [ethereum.id, base.id, arbitrum.id];

function createCryptoAccount(id: string, currency: CryptoCurrency): Account {
  const account = genAccount(id, { currency });
  return { ...account, id };
}

function createBitcoinAccount(id: string): Account {
  return createCryptoAccount(id, bitcoin);
}

const cases = [
  {
    label: "useBuyNavigation",
    useHook: useBuyNavigation,
    getNavigate: (r: ReturnType<typeof useBuyNavigation>) => r.navigateToBuy,
    mode: "buy" as const,
    rampMode: "onRamp" as const,
    useCase: "buy" as const,
  },
  {
    label: "useSellNavigation",
    useHook: useSellNavigation,
    getNavigate: (r: ReturnType<typeof useSellNavigation>) => r.navigateToSell,
    mode: "sell" as const,
    rampMode: "offRamp" as const,
    useCase: "sell" as const,
  },
] as const;

describe.each(cases)(
  "$label (Market actions)",
  ({ useHook, getNavigate, mode, rampMode, useCase }) => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test(`should navigate to exchange in ${rampMode} mode when ledgerCurrency is null`, () => {
      const { result } = renderHook(() => useHook(), {
        initialState: { accounts: [] },
      });

      act(() => {
        getNavigate(result.current as never)(null, "btc");
      });

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/exchange", {
        state: { mode: rampMode, defaultTicker: "BTC", returnTo: "/market" },
      });
      expect(mockOpenAssetAndAccount).not.toHaveBeenCalled();
    });

    test(`should navigate to exchange in ${rampMode} mode with uppercased ticker when ledgerCurrency is undefined`, () => {
      const { result } = renderHook(() => useHook(), {
        initialState: { accounts: [] },
      });

      act(() => {
        getNavigate(result.current as never)(undefined, "eth");
      });

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/exchange", {
        state: { mode: rampMode, defaultTicker: "ETH", returnTo: "/market" },
      });
      expect(mockOpenAssetAndAccount).not.toHaveBeenCalled();
    });

    test(`should navigate to exchange with ${mode} state when no account exists for currency`, () => {
      const { result } = renderHook(() => useHook(), {
        initialState: { accounts: [] },
      });

      act(() => {
        getNavigate(result.current as never)(bitcoin as CryptoOrTokenCurrency);
      });

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/exchange", {
        state: { currency: bitcoin.id, mode, returnTo: "/market" },
      });
      expect(mockOpenAssetAndAccount).not.toHaveBeenCalled();
    });

    test("should navigate to exchange with account when one account exists for crypto currency", () => {
      const account = createBitcoinAccount("account-1");
      const { result } = renderHook(() => useHook(), {
        initialState: { accounts: [account] },
      });

      act(() => {
        getNavigate(result.current as never)(bitcoin as CryptoOrTokenCurrency);
      });

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/exchange", {
        state: { currency: bitcoin.id, account: account.id, mode, returnTo: "/market" },
      });
      expect(mockOpenAssetAndAccount).not.toHaveBeenCalled();
    });

    test("should navigate to exchange with parentAccount when one token account exists", () => {
      const ethereum = getCryptoCurrencyById("ethereum");
      const ethAccount = genAccount("eth-1", { currency: ethereum });
      const tokenAccount = genTokenAccount(0, ethAccount, usdcToken);
      ethAccount.subAccounts = [tokenAccount];

      const { result } = renderHook(() => useHook(), {
        initialState: { accounts: [ethAccount] },
      });

      act(() => {
        getNavigate(result.current as never)(usdcToken as CryptoOrTokenCurrency);
      });

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      const callState = mockNavigate.mock.calls[0][1].state;
      expect(callState.currency).toBe(usdcToken.id);
      expect(callState.account).toBe(ethAccount.id);
      expect(callState.mode).toBe(mode);
      expect(callState.returnTo).toBe("/market");
      expect(mockOpenAssetAndAccount).not.toHaveBeenCalled();
    });

    test("should open drawer for account selection when more than one account exists for currency", () => {
      const account1 = createBitcoinAccount("btc-1");
      const account2 = createBitcoinAccount("btc-2");
      const { result } = renderHook(() => useHook(), {
        initialState: { accounts: [account1, account2] },
      });

      act(() => {
        getNavigate(result.current as never)(bitcoin as CryptoOrTokenCurrency);
      });

      expect(mockOpenAssetAndAccount).toHaveBeenCalledTimes(1);
      expect(mockOpenAssetAndAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          currencies: [bitcoin.id],
          areCurrenciesFiltered: true,
          useCase,
        }),
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test("should open drawer with all provided currency ids when asset detail has multiple networks", () => {
      const ethAccount = createCryptoAccount("eth-1", ethereum);
      const baseAccount = createCryptoAccount("base-1", base);
      const arbitrumAccount = createCryptoAccount("arbitrum-1", arbitrum);
      const { result } = renderHook(() => useHook(), {
        initialState: { accounts: [ethAccount, baseAccount, arbitrumAccount] },
      });

      act(() => {
        getNavigate(result.current as never)(ethereum, "eth", {
          currencyIds: multiNetworkCurrencyIds,
        });
      });

      expect(mockOpenAssetAndAccount).toHaveBeenCalledTimes(1);
      expect(mockOpenAssetAndAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          currencies: multiNetworkCurrencyIds,
          areCurrenciesFiltered: true,
          useCase,
        }),
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test("should navigate to exchange when drawer onSuccess is called with selected account", () => {
      const account1 = createBitcoinAccount("btc-1");
      const account2 = createBitcoinAccount("btc-2");
      let onSuccessCallback: ((account: Account, parentAccount?: Account) => void) | undefined;

      mockOpenAssetAndAccount.mockImplementation(
        ({ onSuccess }: { onSuccess?: (a: Account, p?: Account) => void }) => {
          onSuccessCallback = onSuccess;
        },
      );

      const { result } = renderHook(() => useHook(), {
        initialState: { accounts: [account1, account2] },
      });

      act(() => {
        getNavigate(result.current as never)(bitcoin as CryptoOrTokenCurrency);
      });

      expect(mockOpenAssetAndAccount).toHaveBeenCalled();
      expect(onSuccessCallback).toBeDefined();

      act(() => {
        onSuccessCallback?.(account1);
      });

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/exchange", {
        state: { currency: bitcoin.id, account: account1.id, mode, returnTo: "/market" },
      });
    });

    test("should navigate with selected network currency when multi-network drawer succeeds", () => {
      const ethAccount = createCryptoAccount("eth-1", ethereum);
      const baseAccount = createCryptoAccount("base-1", base);
      let onSuccessCallback: ((account: Account, parentAccount?: Account) => void) | undefined;

      mockOpenAssetAndAccount.mockImplementation(
        ({ onSuccess }: { onSuccess?: (a: Account, p?: Account) => void }) => {
          onSuccessCallback = onSuccess;
        },
      );

      const { result } = renderHook(() => useHook(), {
        initialState: { accounts: [ethAccount, baseAccount] },
      });

      act(() => {
        getNavigate(result.current as never)(ethereum, "eth", {
          currencyIds: multiNetworkCurrencyIds,
        });
      });

      expect(mockOpenAssetAndAccount).toHaveBeenCalled();
      expect(onSuccessCallback).toBeDefined();

      act(() => {
        onSuccessCallback?.(baseAccount);
      });

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/exchange", {
        state: { currency: base.id, account: baseAccount.id, mode, returnTo: "/market" },
      });
    });
  },
);
