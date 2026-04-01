import { act } from "@testing-library/react-native";
import { renderHook } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { CategorizedAssets } from "@ledgerhq/asset-aggregation/assetCategorization/types";
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

const mockCategorizedAssets = jest.fn();

jest.mock("LLM/hooks/useCategorizedAssetsFromPortfolio", () => ({
  useCategorizedAssetsFromPortfolio: () => mockCategorizedAssets(),
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

const mockPortfolio = (
  cryptos: CategorizedAssets["cryptos"] = [],
  stablecoins: CategorizedAssets["stablecoins"] = [],
): void => {
  mockCategorizedAssets.mockReturnValue({
    categorizedAssets: { cryptos, stablecoins },
    stablecoinTickers: new Set<string>(),
    isLoadingStablecoinTickers: false,
  });
};

const makeCategorizedItem = (
  currency: ReturnType<typeof getCryptoCurrencyById>,
  value: number,
) => ({
  currency,
  balance: value,
  value,
  distribution: 0,
  accounts: [],
});

describe("useCryptoAddressesButtonViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPortfolio();
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
    it("should return currencies sorted by countervalue descending", () => {
      mockPortfolio([
        makeCategorizedItem(bitcoin, 500),
        makeCategorizedItem(ethereum, 1000),
        makeCategorizedItem(solana, 200),
      ]);

      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([btcAccount, ethAccount]),
      });

      expect(result.current.firstThreeCurrencies).toHaveLength(3);
      expect(result.current.firstThreeCurrencies[0]).toBe(ethereum);
      expect(result.current.firstThreeCurrencies[1]).toBe(bitcoin);
      expect(result.current.firstThreeCurrencies[2]).toBe(solana);
    });

    it("should cap at 3 currencies", () => {
      mockPortfolio([
        makeCategorizedItem(bitcoin, 1000),
        makeCategorizedItem(ethereum, 800),
        makeCategorizedItem(solana, 600),
        makeCategorizedItem(ripple, 400),
      ]);

      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([btcAccount]),
      });

      expect(result.current.firstThreeCurrencies).toHaveLength(3);
    });

    it("should include stablecoins sorted by countervalue alongside cryptos", () => {
      mockPortfolio([makeCategorizedItem(bitcoin, 300)], [makeCategorizedItem(ethereum, 900)]);

      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([btcAccount, ethAccount]),
      });

      expect(result.current.firstThreeCurrencies[0]).toBe(ethereum);
      expect(result.current.firstThreeCurrencies[1]).toBe(bitcoin);
    });

    it("should return empty array when portfolio has no assets", () => {
      mockPortfolio([], []);

      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([]),
      });

      expect(result.current.firstThreeCurrencies).toHaveLength(0);
    });
  });

  describe("onPress — with accounts (view)", () => {
    it("should navigate to AssetsList", () => {
      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([btcAccount]),
      });

      act(() => {
        result.current.onPress();
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Assets, {
        screen: ScreenName.AssetsList,
        params: {
          sourceScreenName: ScreenName.Portfolio,
          showHeader: true,
          isSyncEnabled: true,
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
