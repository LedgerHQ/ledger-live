import { act } from "@testing-library/react-native";
import { renderHook } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { NavigatorName, ScreenName } from "~/const";
import { State } from "~/reducers/types";
import { track } from "~/analytics";
import { replaceAccounts } from "~/actions/accounts";
import { useCryptoAddressesButtonViewModel } from "../useCryptoAddressesButtonViewModel";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ name: "Portfolio" }),
}));

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");
const solana = getCryptoCurrencyById("solana");
const ripple = getCryptoCurrencyById("ripple");

const btcAccount = genAccount("btc1", { currency: bitcoin });
const ethAccount = genAccount("eth1", { currency: ethereum });

const withAccounts =
  (accounts: object[]) =>
  (state: State): State => ({
    ...state,
    accounts: { active: accounts as State["accounts"]["active"] },
  });

describe("useCryptoAddressesButtonViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("accountsCount", () => {
    it("should return the number of accounts", () => {
      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([btcAccount, ethAccount]),
      });

      expect(result.current.accountsCount).toBe(2);
    });

    it("should return 0 when there are no accounts", () => {
      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([]),
      });

      expect(result.current.accountsCount).toBe(0);
    });
  });

  describe("firstThreeCurrencies", () => {
    it("should return unique currencies from accounts", () => {
      const solAccount = genAccount("sol1", { currency: solana });

      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([btcAccount, ethAccount, solAccount]),
      });

      expect(result.current.firstThreeCurrencies).toHaveLength(3);
      expect(result.current.firstThreeCurrencies).toEqual(
        expect.arrayContaining([bitcoin, ethereum, solana]),
      );
    });

    it("should cap at 3 currencies", () => {
      const accounts = [bitcoin, ethereum, solana, ripple].map((c, i) =>
        genAccount(`acc${i}`, { currency: c }),
      );

      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts(accounts),
      });

      expect(result.current.firstThreeCurrencies).toHaveLength(3);
    });

    it("should deduplicate accounts with the same currency", () => {
      const btcAccount2 = genAccount("btc2", { currency: bitcoin });

      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([btcAccount, btcAccount2, ethAccount]),
      });

      expect(result.current.firstThreeCurrencies).toHaveLength(2);
      expect(result.current.firstThreeCurrencies).toEqual(
        expect.arrayContaining([bitcoin, ethereum]),
      );
    });

    it("should return empty array when there are no accounts", () => {
      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([]),
      });

      expect(result.current.firstThreeCurrencies).toHaveLength(0);
    });
  });

  describe("onPress — with accounts (view)", () => {
    it("should navigate to AccountsList", () => {
      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([btcAccount]),
      });

      act(() => {
        result.current.onPress();
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Accounts, {
        screen: ScreenName.CryptoAddresses,
        params: {
          sourceScreenName: ScreenName.Portfolio,
        },
      });
    });

    it("should track account_cta with type view", () => {
      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([btcAccount]),
      });

      act(() => {
        result.current.onPress();
      });

      expect(jest.mocked(track)).toHaveBeenCalledWith("button_clicked", {
        button: "account_cta",
        type: "view",
        page: "Portfolio",
      });
    });
  });

  describe("onPress — without accounts (add)", () => {
    it("should open add account drawer when no accounts", () => {
      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([]),
      });

      act(() => {
        result.current.onPress();
      });

      expect(result.current.isAddAccountOpen).toBe(true);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should track account_cta with type add", () => {
      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([]),
      });

      act(() => {
        result.current.onPress();
      });

      expect(jest.mocked(track)).toHaveBeenCalledWith("button_clicked", {
        button: "account_cta",
        type: "add",
        page: "Portfolio",
      });
    });

    it("should close add account drawer on onCloseAddAccount", () => {
      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([]),
      });

      act(() => {
        result.current.onPress();
      });

      expect(result.current.isAddAccountOpen).toBe(true);

      act(() => {
        result.current.onCloseAddAccount();
      });

      expect(result.current.isAddAccountOpen).toBe(false);
    });
  });

  describe("moreAccountsCount", () => {
    it("should be total accounts minus displayed icon slots when above three accounts", () => {
      const fiveAccounts = [
        genAccount("a1", { currency: bitcoin }),
        genAccount("a2", { currency: bitcoin }),
        genAccount("a3", { currency: bitcoin }),
        genAccount("a4", { currency: bitcoin }),
        genAccount("a5", { currency: bitcoin }),
      ];
      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts(fiveAccounts),
      });

      expect(result.current.moreAccountsCount).toBe(2);
    });

    it("should be non-positive when at most three accounts", () => {
      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([btcAccount, ethAccount]),
      });

      expect(result.current.moreAccountsCount).toBeLessThanOrEqual(0);
    });

    it("should not exceed 99", () => {
      const manyAccounts = Array.from({ length: 105 }, (_, i) =>
        genAccount(`many${i}`, { currency: bitcoin }),
      );
      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts(manyAccounts),
      });

      expect(result.current.moreAccountsCount).toBe(99);
    });
  });

  describe("hasAccounts", () => {
    it("should be true when accounts exist", () => {
      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([btcAccount]),
      });

      expect(result.current.hasAccounts).toBe(true);
    });

    it("should be false when no accounts", () => {
      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([]),
      });

      expect(result.current.hasAccounts).toBe(false);
    });
  });

  describe("drawer auto-close on account added", () => {
    it("should close the add account drawer when hasAccounts flips to true", () => {
      const { result, store } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([]),
      });

      act(() => {
        result.current.onPress();
      });

      expect(result.current.isAddAccountOpen).toBe(true);

      act(() => {
        store.dispatch(replaceAccounts([btcAccount] as Parameters<typeof replaceAccounts>[0]));
      });

      expect(result.current.isAddAccountOpen).toBe(false);
    });
  });
});
