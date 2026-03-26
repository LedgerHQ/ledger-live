import { act } from "@testing-library/react-native";
import { renderHook } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { Asset } from "~/types/asset";
import { State } from "~/reducers/types";
import { CategorizedAssets } from "@ledgerhq/asset-aggregation/assetCategorization/types";
import usePortfolioStablecoinsSectionViewModel from "../usePortfolioStablecoinsSectionViewModel";
import { bitcoin, ethereum, createAsset } from "./shared";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ name: "Portfolio" }),
}));

const mockAssetsData = jest.fn();

jest.mock("@ledgerhq/live-common/dada-client/hooks/useAssetsData", () => ({
  useAssetsData: () => mockAssetsData(),
}));

const mockCategorizedAssets = jest.fn();

jest.mock("LLM/hooks/useCategorizedAssetsFromPortfolio", () => ({
  useCategorizedAssetsFromPortfolio: () => mockCategorizedAssets(),
}));

const toCategorizedItem = (asset: Asset) => ({
  currency: asset.currency,
  balance: asset.amount,
  value: 0,
  distribution: 0,
  accounts: asset.accounts,
});

const mockPortfolioWithStablecoins = (
  stablecoinAssets: Asset[] = [],
  cryptoAssets: Asset[] = [],
): void => {
  const categorizedAssets: CategorizedAssets = {
    cryptos: cryptoAssets.map(toCategorizedItem),
    stablecoins: stablecoinAssets.map(toCategorizedItem),
  };
  mockCategorizedAssets.mockReturnValue({
    categorizedAssets,
    stablecoinTickers: new Set<string>(),
    isLoadingStablecoinTickers: false,
  });
};

describe("usePortfolioStablecoinsSectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAssetsData.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    mockPortfolioWithStablecoins();
  });

  describe("asset display and hasMore", () => {
    it("should return empty assets when there are no stablecoins", () => {
      const { result } = renderHook(() => usePortfolioStablecoinsSectionViewModel());

      expect(result.current.assetsCount).toBe(0);
      expect(result.current.assetsToDisplay).toHaveLength(0);
      expect(result.current.hasMore).toBe(false);
    });

    it("should filter to stablecoins only, excluding cryptos", () => {
      mockPortfolioWithStablecoins([createAsset(ethereum, 2000)], [createAsset(bitcoin, 100000)]);

      const { result } = renderHook(() => usePortfolioStablecoinsSectionViewModel());

      expect(result.current.assetsCount).toBe(1);
      expect(result.current.assetsToDisplay[0].currency).toBe(ethereum);
    });

    it("should cap display at 6, report total count, and set hasMore when list exceeds limit", () => {
      const ten = Array.from({ length: 10 }, (_, i) => createAsset(bitcoin, 10000 * (10 - i)));
      mockPortfolioWithStablecoins(ten);

      const { result } = renderHook(() => usePortfolioStablecoinsSectionViewModel());

      expect(result.current.assetsCount).toBe(10);
      expect(result.current.assetsToDisplay).toHaveLength(6);
      expect(result.current.hasMore).toBe(true);
    });

    it("should not set hasMore when there are 6 stablecoins or fewer", () => {
      const six = Array.from({ length: 6 }, (_, i) => createAsset(bitcoin, 10000 * (6 - i)));
      mockPortfolioWithStablecoins(six);

      const { result } = renderHook(() => usePortfolioStablecoinsSectionViewModel());

      expect(result.current.hasMore).toBe(false);
    });

    it("should always report hasMore false in isEmptyState or isReadOnly mode", () => {
      const seven = Array.from({ length: 7 }, (_, i) => createAsset(bitcoin, 10000 * (7 - i)));
      mockPortfolioWithStablecoins(seven);

      const { result: emptyResult } = renderHook(() =>
        usePortfolioStablecoinsSectionViewModel({ isEmptyState: true }),
      );
      const { result: readOnlyResult } = renderHook(() =>
        usePortfolioStablecoinsSectionViewModel({ isReadOnly: true }),
      );

      expect(emptyResult.current.hasMore).toBe(false);
      expect(readOnlyResult.current.hasMore).toBe(false);
    });

    it("should navigate to AssetsList on onPressShowAll when assetSection is enabled", () => {
      const { result } = renderHook(() => usePortfolioStablecoinsSectionViewModel(), {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              lwmWallet40: { enabled: true, params: { assetSection: true } },
            },
          },
        }),
      });

      act(() => result.current.onPressShowAll());

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Assets, {
        screen: ScreenName.AssetsList,
        params: { sourceScreenName: ScreenName.Portfolio, showHeader: true, isSyncEnabled: true },
      });
    });

    it("should navigate to Asset detail on onItemPress", () => {
      mockPortfolioWithStablecoins([createAsset(ethereum, 5000)]);
      const { result } = renderHook(() => usePortfolioStablecoinsSectionViewModel());

      act(() => result.current.onItemPress(result.current.assetsToDisplay[0]));

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Accounts, {
        screen: ScreenName.Asset,
        params: { currency: ethereum },
      });
    });

    it("should navigate to MarketDetail on onItemPress for placeholder assets", () => {
      const placeholder: Asset = {
        ...createAsset(bitcoin, 0),
        isPlaceholder: true,
        marketId: "bitcoin",
      };
      const { result } = renderHook(() => usePortfolioStablecoinsSectionViewModel());

      act(() => result.current.onItemPress(placeholder));

      expect(mockNavigate).toHaveBeenCalledWith(ScreenName.MarketDetail, { currencyId: "bitcoin" });
    });
  });

  describe("isLoading / isError", () => {
    it("should expose isLoading true when the DADA API is loading", () => {
      mockAssetsData.mockReturnValue({ data: undefined, isLoading: true, isError: false });

      const { result } = renderHook(() =>
        usePortfolioStablecoinsSectionViewModel({ isEmptyState: true }),
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isError).toBe(false);
    });

    it("should expose isError true when the DADA API fails", () => {
      mockAssetsData.mockReturnValue({ data: undefined, isLoading: false, isError: true });

      const { result } = renderHook(() =>
        usePortfolioStablecoinsSectionViewModel({ isEmptyState: true }),
      );

      expect(result.current.isError).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it("should expose isLoading false and isError false in the nominal case", () => {
      const { result } = renderHook(() => usePortfolioStablecoinsSectionViewModel());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
    });
  });

});
