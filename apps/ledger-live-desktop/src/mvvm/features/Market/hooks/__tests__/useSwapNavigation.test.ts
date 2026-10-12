import { act, renderHook } from "tests/testSetup";
import { useSwapNavigation } from "../useSwapNavigation";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";

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
const arbitrum = getCryptoCurrencyById("arbitrum");

function renderNavigation(accounts: Account[]) {
  return renderHook(() => useSwapNavigation(), { initialState: { accounts } }).result;
}

function pickInDrawer(account: AccountLike, parentAccount?: Account) {
  act(() => {
    mockOpenAssetAndAccount.mock.calls[0][0].onSuccess(account, parentAccount);
  });
}

describe("useSwapNavigation (Market actions)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("without an account", () => {
    test("opens swap on the crypto currency right away", () => {
      const result = renderNavigation([]);

      act(() => result.current.navigateToSwap(bitcoin as CryptoOrTokenCurrency));

      expect(mockOpenAssetAndAccount).not.toHaveBeenCalled();
      const { state } = mockNavigate.mock.calls[0][1];
      expect(state).toEqual(
        expect.objectContaining({
          defaultCurrency: { toCurrencyId: bitcoin.id },
          from: "/market",
          defaultAmountFrom: "0",
        }),
      );
      expect(state.defaultAccountId).toBeUndefined();
    });

    test("opens swap on the token right away", () => {
      const result = renderNavigation([]);

      act(() => result.current.navigateToSwap(usdcToken as CryptoOrTokenCurrency));

      expect(mockOpenAssetAndAccount).not.toHaveBeenCalled();
      expect(mockNavigate.mock.calls[0][1].state).toEqual(
        expect.objectContaining({
          defaultCurrency: { toCurrencyId: usdcToken.id },
          defaultToken: { toTokenId: usdcToken.id },
        }),
      );
    });
  });

  describe("with an account", () => {
    // Swap opens only once the network and account are picked, even for a single account.
    test("waits for the drawer pick before opening swap", () => {
      const account = genAccount("btc-1", { currency: bitcoin });
      const result = renderNavigation([account]);

      act(() => result.current.navigateToSwap(bitcoin as CryptoOrTokenCurrency));

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockOpenAssetAndAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          currencies: [bitcoin.id],
          areCurrenciesFiltered: true,
          useCase: "swap",
        }),
      );

      pickInDrawer(account);

      expect(mockNavigate).toHaveBeenCalledWith("/swap", {
        state: expect.objectContaining({
          defaultCurrency: { toCurrencyId: bitcoin.id },
          defaultAccountId: account.id,
        }),
      });
    });

    test("swaps from the picked token account and its parent", () => {
      const ethAccount = genAccount("eth-1", { currency: ethereum });
      const tokenAccount = genTokenAccount(0, ethAccount, usdcToken);
      ethAccount.subAccounts = [tokenAccount];
      const result = renderNavigation([ethAccount]);

      act(() => result.current.navigateToSwap(usdcToken as CryptoOrTokenCurrency));
      pickInDrawer(tokenAccount, ethAccount);

      const { state } = mockNavigate.mock.calls[0][1];
      expect(state.defaultAccountId).toBe(tokenAccount.id);
      expect(state.defaultParentAccountId).toBe(ethAccount.id);
      expect(state.defaultCurrency).toEqual({ toCurrencyId: usdcToken.id });
    });

    test("offers every network of the asset and swaps from the picked one", () => {
      const arbitrumAccount = genAccount("arb-1", { currency: arbitrum });
      const result = renderNavigation([arbitrumAccount]);

      act(() =>
        result.current.navigateToSwap(ethereum as CryptoOrTokenCurrency, {
          currencyIds: [ethereum.id, arbitrum.id],
        }),
      );

      expect(mockOpenAssetAndAccount).toHaveBeenCalledWith(
        expect.objectContaining({ currencies: [ethereum.id, arbitrum.id] }),
      );

      pickInDrawer(arbitrumAccount);

      expect(mockNavigate).toHaveBeenCalledWith("/swap", {
        state: expect.objectContaining({
          defaultCurrency: { toCurrencyId: arbitrum.id },
          defaultAccountId: arbitrumAccount.id,
        }),
      });
    });
  });
});
