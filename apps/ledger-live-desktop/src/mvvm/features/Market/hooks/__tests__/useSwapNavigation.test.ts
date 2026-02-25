import { act, renderHook } from "tests/testSetup";
import { useSwapNavigation } from "../useSwapNavigation";
import { genAccount, genTokenAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

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

function createBitcoinAccount(id: string): Account {
  const account = genAccount(id, { currency: bitcoin });
  return { ...account, id };
}

describe("useSwapNavigation (Market actions)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should navigate to swap with defaultAccountId when one account exists for currency", () => {
    const account = createBitcoinAccount("account-1");
    const { result } = renderHook(() => useSwapNavigation(), {
      initialState: { accounts: [account] },
    });

    act(() => {
      result.current.navigateToSwap(bitcoin as CryptoOrTokenCurrency);
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/swap", {
      state: expect.objectContaining({
        defaultCurrency: bitcoin.id,
        from: "/market",
        defaultAccountId: account.id,
        defaultAmountFrom: "0",
      }),
    });
    expect(mockOpenAssetAndAccount).not.toHaveBeenCalled();
  });

  test("should navigate to swap with tokenId and defaultAccountId when one account exists for token", () => {
    const ethereum = getCryptoCurrencyById("ethereum");
    const ethAccount = genAccount("eth-1", { currency: ethereum });
    const tokenAccount = genTokenAccount(0, ethAccount, usdcToken);
    ethAccount.subAccounts = [tokenAccount];

    const { result } = renderHook(() => useSwapNavigation(), {
      initialState: { accounts: [ethAccount] },
    });

    act(() => {
      result.current.navigateToSwap(usdcToken as CryptoOrTokenCurrency);
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const callState = mockNavigate.mock.calls[0][1].state;
    expect(callState.defaultAccountId).toBe(tokenAccount.id);
    expect(callState.defaultParentAccountId).toBe(ethAccount.id);
    expect(callState.defaultCurrency).toBe(usdcToken.id);
    expect(mockOpenAssetAndAccount).not.toHaveBeenCalled();
  });

  test("should navigate to swap webview with toTokenId only when no account exists for token", () => {
    const { result } = renderHook(() => useSwapNavigation(), {
      initialState: { accounts: [] },
    });

    act(() => {
      result.current.navigateToSwap(usdcToken as CryptoOrTokenCurrency);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/swap", {
      state: expect.objectContaining({
        defaultCurrency: usdcToken.id,
        from: "/market",
        defaultToken: { toTokenId: usdcToken.id },
        defaultAmountFrom: "0",
      }),
    });
    expect(mockNavigate.mock.calls[0][1].state.defaultAccountId).toBeUndefined();
    expect(mockOpenAssetAndAccount).not.toHaveBeenCalled();
  });

  test("should navigate to swap webview with defaultCurrency only when no account exists for crypto currency", () => {
    const { result } = renderHook(() => useSwapNavigation(), {
      initialState: { accounts: [] },
    });

    act(() => {
      result.current.navigateToSwap(bitcoin as CryptoOrTokenCurrency);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/swap", {
      state: expect.objectContaining({
        defaultCurrency: bitcoin.id,
        from: "/market",
        defaultAmountFrom: "0",
      }),
    });
    expect(mockNavigate.mock.calls[0][1].state.defaultToken).toBeUndefined();
    expect(mockNavigate.mock.calls[0][1].state.defaultAccountId).toBeUndefined();
    expect(mockOpenAssetAndAccount).not.toHaveBeenCalled();
  });

  test("should auto-select and navigate when only one account exists for currency", () => {
    const account = createBitcoinAccount("single-btc");
    const { result } = renderHook(() => useSwapNavigation(), {
      initialState: { accounts: [account] },
    });

    act(() => {
      result.current.navigateToSwap(bitcoin as CryptoOrTokenCurrency);
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/swap", {
      state: expect.objectContaining({
        defaultAccountId: account.id,
        defaultCurrency: bitcoin.id,
      }),
    });
    expect(mockOpenAssetAndAccount).not.toHaveBeenCalled();
  });

  test("should open drawer for account selection when more than one account exists for currency", () => {
    const account1 = createBitcoinAccount("btc-1");
    const account2 = createBitcoinAccount("btc-2");
    const { result } = renderHook(() => useSwapNavigation(), {
      initialState: { accounts: [account1, account2] },
    });

    act(() => {
      result.current.navigateToSwap(bitcoin as CryptoOrTokenCurrency);
    });

    expect(mockOpenAssetAndAccount).toHaveBeenCalledTimes(1);
    expect(mockOpenAssetAndAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        currencies: [bitcoin.id],
        areCurrenciesFiltered: true,
        useCase: "swap",
      }),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
