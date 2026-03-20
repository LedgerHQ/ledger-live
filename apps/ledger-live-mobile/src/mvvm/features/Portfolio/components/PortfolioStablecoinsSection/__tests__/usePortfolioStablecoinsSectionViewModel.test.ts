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

jest.mock("@ledgerhq/live-common/dada-client/hooks/useAssetsData", () => ({
  useAssetsData: () => ({ data: undefined, isLoading: false }),
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
    mockPortfolioWithStablecoins();
  });

  describe("asset filtering and display", () => {
    it("should return empty assets when there are no stablecoins in distribution", () => {
      mockPortfolioWithStablecoins([]);

      const { result } = renderHook(() => usePortfolioStablecoinsSectionViewModel());

      expect(result.current.assetsCount).toBe(0);
      expect(result.current.assetsToDisplay).toHaveLength(0);
    });

    it("should return only stablecoins from the categorized distribution", () => {
      mockPortfolioWithStablecoins(
        [createAsset(ethereum, 2000)],
        [createAsset(bitcoin, 100000)],
      );

      const { result } = renderHook(() => usePortfolioStablecoinsSectionViewModel());

      expect(result.current.assetsCount).toBe(1);
      expect(result.current.assetsToDisplay).toHaveLength(1);
      expect(result.current.assetsToDisplay[0].currency).toBe(ethereum);
    });

    it("should return all stablecoins when fewer than 6 are available", () => {
      mockPortfolioWithStablecoins([
        createAsset(bitcoin, 100000),
        createAsset(ethereum, 2000),
      ]);

      const { result } = renderHook(() => usePortfolioStablecoinsSectionViewModel());

      expect(result.current.assetsCount).toBe(2);
      expect(result.current.assetsToDisplay).toHaveLength(2);
    });

    it("should limit displayed stablecoins to 6 while showing the total count", () => {
      const mockStablecoins = Array.from({ length: 10 }, (_, i) =>
        createAsset(bitcoin, 10000 * (10 - i)),
      );
      mockPortfolioWithStablecoins(mockStablecoins);

      const { result } = renderHook(() => usePortfolioStablecoinsSectionViewModel());

      expect(result.current.assetsCount).toBe(10);
      expect(result.current.assetsToDisplay).toHaveLength(6);
    });
  });

  describe("hasMore", () => {
    it("should be false when there are 6 stablecoins or fewer", () => {
      const mockStablecoins = Array.from({ length: 6 }, (_, i) =>
        createAsset(bitcoin, 10000 * (6 - i)),
      );
      mockPortfolioWithStablecoins(mockStablecoins);

      const { result } = renderHook(() => usePortfolioStablecoinsSectionViewModel());

      expect(result.current.hasMore).toBe(false);
    });

    it("should be true when there are more than 6 stablecoins", () => {
      const mockStablecoins = Array.from({ length: 7 }, (_, i) =>
        createAsset(bitcoin, 10000 * (7 - i)),
      );
      mockPortfolioWithStablecoins(mockStablecoins);

      const { result } = renderHook(() => usePortfolioStablecoinsSectionViewModel());

      expect(result.current.hasMore).toBe(true);
    });
  });

  describe("onPressShowAll", () => {
    it("should navigate to AssetsList when llmAccountListUI is enabled", () => {
      const { result } = renderHook(() => usePortfolioStablecoinsSectionViewModel(), {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: { llmAccountListUI: { enabled: true } },
          },
        }),
      });

      act(() => {
        result.current.onPressShowAll();
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

    it("should navigate to legacy Assets screen when llmAccountListUI is disabled", () => {
      const { result } = renderHook(() => usePortfolioStablecoinsSectionViewModel(), {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: { llmAccountListUI: { enabled: false } },
          },
        }),
      });

      act(() => {
        result.current.onPressShowAll();
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Accounts, {
        screen: ScreenName.Assets,
      });
    });
  });

  describe("onItemPress", () => {
    it("should navigate to Asset detail screen with the currency", () => {
      mockPortfolioWithStablecoins([createAsset(ethereum, 5000)]);
      const { result } = renderHook(() => usePortfolioStablecoinsSectionViewModel());

      act(() => {
        result.current.onItemPress(result.current.assetsToDisplay[0]);
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Accounts, {
        screen: ScreenName.Asset,
        params: { currency: ethereum },
      });
    });

    it("should navigate to MarketDetail for placeholder assets", () => {
      const placeholderAsset: Asset = {
        ...createAsset(bitcoin, 0),
        isPlaceholder: true,
        marketId: "bitcoin",
      };
      const { result } = renderHook(() => usePortfolioStablecoinsSectionViewModel());

      act(() => {
        result.current.onItemPress(placeholderAsset);
      });

      expect(mockNavigate).toHaveBeenCalledWith(ScreenName.MarketDetail, {
        currencyId: "bitcoin",
      });
    });
  });

  describe("isEmptyState", () => {
    it("should always return hasMore false", () => {
      const { result } = renderHook(() =>
        usePortfolioStablecoinsSectionViewModel({ isEmptyState: true }),
      );

      expect(result.current.hasMore).toBe(false);
    });
  });

  describe("isReadOnly", () => {
    it("should always return hasMore false", () => {
      const { result } = renderHook(() =>
        usePortfolioStablecoinsSectionViewModel({ isReadOnly: true }),
      );

      expect(result.current.hasMore).toBe(false);
    });
  });
});
