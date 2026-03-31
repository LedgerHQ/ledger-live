import { act } from "@testing-library/react-native";
import { renderHook } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { State } from "~/reducers/types";
import { Asset } from "~/types/asset";
import { track } from "~/analytics";
import useCryptoViewModel from "../useCryptoViewModel";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useFocusEffect: jest.fn(),
}));

const mockCategorizedAssets = jest.fn();

jest.mock("LLM/hooks/useCategorizedAssetsFromPortfolio", () => ({
  useCategorizedAssetsFromPortfolio: () => mockCategorizedAssets(),
}));

jest.mock("~/actions/general", () => ({
  ...jest.requireActual("~/actions/general"),
  useRefreshAccountsOrdering: () => jest.fn(),
}));

const withBlacklistedTokens =
  (tokenIds: string[]) =>
  (state: State): State => ({
    ...state,
    settings: { ...state.settings, blacklistedTokenIds: tokenIds },
  });

const makeCurrency = (name: string, id: string, type = "CryptoCurrency") =>
  ({
    name,
    id,
    ticker: id.toUpperCase(),
    type,
    units: [{ code: id.toUpperCase(), name, magnitude: 8 }],
  }) as unknown as Asset["currency"];

const makeCategorizedItem = (name: string, id: string, type = "CryptoCurrency") => ({
  currency: makeCurrency(name, id, type),
  balance: 100,
  value: 100,
  distribution: 0.5,
  accounts: [],
});

const emptyCategorizedAssets = () => ({
  categorizedAssets: { cryptos: [], stablecoins: [] },
  stablecoinTickers: new Set<string>(),
  isLoadingStablecoinTickers: false,
});

describe("useCryptoViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCategorizedAssets.mockReturnValue(emptyCategorizedAssets());
  });

  describe("assetsToDisplay — variant: all (default)", () => {
    it("should return all assets (cryptos + stablecoins) when no variant is provided", () => {
      const btcItem = makeCategorizedItem("Bitcoin", "bitcoin");
      const usdtItem = makeCategorizedItem("Tether", "usdt-token", "TokenCurrency");

      mockCategorizedAssets.mockReturnValue({
        ...emptyCategorizedAssets(),
        categorizedAssets: { cryptos: [btcItem], stablecoins: [usdtItem] },
      });

      const { result } = renderHook(() =>
        useCryptoViewModel({ sourceScreenName: ScreenName.Portfolio }),
      );

      expect(result.current.assetsToDisplay).toHaveLength(2);
    });

    it("should return empty array when there are no assets", () => {
      const { result } = renderHook(() =>
        useCryptoViewModel({ sourceScreenName: ScreenName.Portfolio }),
      );

      expect(result.current.assetsToDisplay).toHaveLength(0);
    });

    it("should resolve variant to 'all' when not provided", () => {
      const { result } = renderHook(() =>
        useCryptoViewModel({ sourceScreenName: ScreenName.Portfolio }),
      );

      expect(result.current.variant).toBe("all");
    });
  });

  describe("assetsToDisplay — variant: crypto", () => {
    it("should return only crypto assets", () => {
      const btcItem = makeCategorizedItem("Bitcoin", "bitcoin");
      const usdtItem = makeCategorizedItem("Tether", "usdt-token", "TokenCurrency");

      mockCategorizedAssets.mockReturnValue({
        ...emptyCategorizedAssets(),
        categorizedAssets: { cryptos: [btcItem], stablecoins: [usdtItem] },
      });

      const { result } = renderHook(() =>
        useCryptoViewModel({ sourceScreenName: ScreenName.Portfolio, variant: "crypto" }),
      );

      expect(result.current.assetsToDisplay).toHaveLength(1);
      expect(result.current.assetsToDisplay[0].currency.name).toBe("Bitcoin");
    });
  });

  describe("assetsToDisplay — variant: stablecoin", () => {
    it("should return only stablecoin assets", () => {
      const btcItem = makeCategorizedItem("Bitcoin", "bitcoin");
      const usdtItem = makeCategorizedItem("Tether", "usdt-token", "TokenCurrency");

      mockCategorizedAssets.mockReturnValue({
        ...emptyCategorizedAssets(),
        categorizedAssets: { cryptos: [btcItem], stablecoins: [usdtItem] },
      });

      const { result } = renderHook(() =>
        useCryptoViewModel({ sourceScreenName: ScreenName.Portfolio, variant: "stablecoin" }),
      );

      expect(result.current.assetsToDisplay).toHaveLength(1);
      expect(result.current.assetsToDisplay[0].currency.name).toBe("Tether");
    });
  });

  describe("blacklist filtering", () => {
    it("should filter out blacklisted token assets", () => {
      const btcItem = makeCategorizedItem("Bitcoin", "bitcoin");
      const tokenItem = makeCategorizedItem("USDT", "usdt-token", "TokenCurrency");

      mockCategorizedAssets.mockReturnValue({
        ...emptyCategorizedAssets(),
        categorizedAssets: { cryptos: [btcItem], stablecoins: [tokenItem] },
      });

      const { result } = renderHook(
        () => useCryptoViewModel({ sourceScreenName: ScreenName.Portfolio }),
        { overrideInitialState: withBlacklistedTokens(["usdt-token"]) },
      );

      expect(result.current.assetsToDisplay).toHaveLength(1);
      expect(result.current.assetsToDisplay[0].currency.name).toBe("Bitcoin");
    });

    it("should keep non-blacklisted tokens", () => {
      const tokenItem = makeCategorizedItem("USDC", "usdc-token", "TokenCurrency");

      mockCategorizedAssets.mockReturnValue({
        ...emptyCategorizedAssets(),
        categorizedAssets: { cryptos: [], stablecoins: [tokenItem] },
      });

      const { result } = renderHook(
        () => useCryptoViewModel({ sourceScreenName: ScreenName.Portfolio }),
        { overrideInitialState: withBlacklistedTokens(["other-token"]) },
      );

      expect(result.current.assetsToDisplay).toHaveLength(1);
    });
  });

  describe("onItemPress", () => {
    it("should navigate to Asset screen", () => {
      const btcItem = makeCategorizedItem("Bitcoin", "bitcoin");

      mockCategorizedAssets.mockReturnValue({
        ...emptyCategorizedAssets(),
        categorizedAssets: { cryptos: [btcItem], stablecoins: [] },
      });

      const { result } = renderHook(() =>
        useCryptoViewModel({ sourceScreenName: ScreenName.Portfolio, variant: "crypto" }),
      );

      act(() => {
        result.current.onItemPress(result.current.assetsToDisplay[0]);
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Accounts, {
        screen: ScreenName.Asset,
        params: { currency: btcItem.currency },
      });
    });

    it("should track asset_clicked with page 'AllAssets' when no variant", () => {
      const btcItem = makeCategorizedItem("Bitcoin", "bitcoin");

      mockCategorizedAssets.mockReturnValue({
        ...emptyCategorizedAssets(),
        categorizedAssets: { cryptos: [btcItem], stablecoins: [] },
      });

      const { result } = renderHook(() =>
        useCryptoViewModel({ sourceScreenName: ScreenName.Portfolio }),
      );

      act(() => {
        result.current.onItemPress(result.current.assetsToDisplay[0]);
      });

      expect(jest.mocked(track)).toHaveBeenCalledWith("asset_clicked", {
        asset: "Bitcoin",
        page: "AllAssets",
      });
    });
  });
});
