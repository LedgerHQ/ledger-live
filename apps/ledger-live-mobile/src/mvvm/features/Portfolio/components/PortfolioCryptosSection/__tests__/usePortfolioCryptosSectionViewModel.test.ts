import { act } from "@testing-library/react-native";
import { renderHook } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { Asset } from "~/types/asset";
import { State } from "~/reducers/types";
import { CategorizedAssets } from "@ledgerhq/asset-aggregation/assetCategorization/types";
import usePortfolioCryptosSectionViewModel from "../usePortfolioCryptosSectionViewModel";
import { bitcoin, ethereum, createCryptoAsset } from "./shared";

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

const mockReadOnlyCoins = jest.fn();

jest.mock("~/hooks/useReadOnlyCoins", () => ({
  useReadOnlyCoins: (opts: { maxDisplayed: number }) => mockReadOnlyCoins(opts),
}));

const toCategorizedItem = (asset: Asset) => ({
  currency: asset.currency,
  balance: asset.amount,
  value: 0,
  distribution: 0,
  accounts: asset.accounts,
});

const mockPortfolioWithCryptos = (
  cryptoAssets: Asset[] = [],
  stablecoinAssets: Asset[] = [],
  stablecoinTickers: string[] = [],
): void => {
  const categorizedAssets: CategorizedAssets = {
    cryptos: cryptoAssets.map(toCategorizedItem),
    stablecoins: stablecoinAssets.map(toCategorizedItem),
  };
  mockCategorizedAssets.mockReturnValue({
    categorizedAssets,
    stablecoinTickers: new Set(stablecoinTickers.map(t => t.toUpperCase())),
    isLoadingStablecoinTickers: false,
  });
};

describe("usePortfolioCryptosSectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPortfolioWithCryptos();
    mockReadOnlyCoins.mockReturnValue({ sortedCryptoCurrencies: [] });
  });

  describe("asset filtering and display", () => {
    it("should return empty assets when there are no cryptos in distribution", () => {
      mockPortfolioWithCryptos([]);

      const { result } = renderHook(() => usePortfolioCryptosSectionViewModel());

      expect(result.current.assetsCount).toBe(0);
      expect(result.current.assetsToDisplay).toHaveLength(0);
    });

    it("should return all assets when fewer than 6 are available", () => {
      mockPortfolioWithCryptos([
        createCryptoAsset(bitcoin, 100000),
        createCryptoAsset(ethereum, 2000),
      ]);

      const { result } = renderHook(() => usePortfolioCryptosSectionViewModel());

      expect(result.current.assetsCount).toBe(2);
      expect(result.current.assetsToDisplay).toHaveLength(2);
    });

    it("should limit displayed assets to 6 while showing the total count", () => {
      const mockAssets = Array.from({ length: 10 }, (_, i) =>
        createCryptoAsset(bitcoin, 10000 * (10 - i)),
      );
      mockPortfolioWithCryptos(mockAssets);

      const { result } = renderHook(() => usePortfolioCryptosSectionViewModel());

      expect(result.current.assetsCount).toBe(10);
      expect(result.current.assetsToDisplay).toHaveLength(6);
    });

    it("should exclude stablecoins — they are in the stablecoins bucket, not cryptos", () => {
      mockPortfolioWithCryptos(
        [createCryptoAsset(bitcoin, 100000)],
        [createCryptoAsset(ethereum, 2000)],
        [ethereum.ticker],
      );

      const { result } = renderHook(() => usePortfolioCryptosSectionViewModel());

      expect(result.current.assetsCount).toBe(1);
      expect(result.current.assetsToDisplay[0].currency).toBe(bitcoin);
    });
  });

  describe("hasMore", () => {
    it("should be false when there are 6 assets or fewer", () => {
      const mockAssets = Array.from({ length: 6 }, (_, i) =>
        createCryptoAsset(bitcoin, 10000 * (6 - i)),
      );
      mockPortfolioWithCryptos(mockAssets);

      const { result } = renderHook(() => usePortfolioCryptosSectionViewModel());

      expect(result.current.hasMore).toBe(false);
    });

    it("should be true when there are more than 6 assets", () => {
      const mockAssets = Array.from({ length: 7 }, (_, i) =>
        createCryptoAsset(bitcoin, 10000 * (7 - i)),
      );
      mockPortfolioWithCryptos(mockAssets);

      const { result } = renderHook(() => usePortfolioCryptosSectionViewModel());

      expect(result.current.hasMore).toBe(true);
    });
  });

  describe("onPressShowAll", () => {
    it("should navigate to AssetsList when llmAccountListUI is enabled", () => {
      const { result } = renderHook(() => usePortfolioCryptosSectionViewModel(), {
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
      const { result } = renderHook(() => usePortfolioCryptosSectionViewModel(), {
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
      mockPortfolioWithCryptos([createCryptoAsset(ethereum, 5000)]);
      const { result } = renderHook(() => usePortfolioCryptosSectionViewModel());

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
        ...createCryptoAsset(bitcoin, 0),
        isPlaceholder: true,
        marketId: "bitcoin",
      };
      const { result } = renderHook(() => usePortfolioCryptosSectionViewModel());

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
        usePortfolioCryptosSectionViewModel({ isEmptyState: true }),
      );

      expect(result.current.hasMore).toBe(false);
    });
  });

  describe("isReadOnly", () => {
    it("should return assets from useReadOnlyCoins", () => {
      mockReadOnlyCoins.mockReturnValue({
        sortedCryptoCurrencies: [bitcoin, ethereum],
      });

      const { result } = renderHook(() =>
        usePortfolioCryptosSectionViewModel({ isReadOnly: true }),
      );

      expect(result.current.assetsCount).toBe(2);
      expect(result.current.assetsToDisplay).toHaveLength(2);
      expect(result.current.assetsToDisplay[0].currency).toBe(bitcoin);
      expect(result.current.assetsToDisplay[1].currency).toBe(ethereum);
    });

    it("should always return hasMore true", () => {
      mockReadOnlyCoins.mockReturnValue({
        sortedCryptoCurrencies: [bitcoin, ethereum],
      });

      const { result } = renderHook(() =>
        usePortfolioCryptosSectionViewModel({ isReadOnly: true }),
      );

      expect(result.current.hasMore).toBe(true);
    });

    it("should navigate to legacy Assets screen on show all press", () => {
      mockReadOnlyCoins.mockReturnValue({
        sortedCryptoCurrencies: [bitcoin, ethereum],
      });

      const { result } = renderHook(() =>
        usePortfolioCryptosSectionViewModel({ isReadOnly: true }),
      );

      act(() => {
        result.current.onPressShowAll();
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Accounts, {
        screen: ScreenName.Assets,
      });
    });

    it("should build assets with zero amount and empty accounts", () => {
      mockReadOnlyCoins.mockReturnValue({
        sortedCryptoCurrencies: [bitcoin],
      });

      const { result } = renderHook(() =>
        usePortfolioCryptosSectionViewModel({ isReadOnly: true }),
      );

      expect(result.current.assetsToDisplay[0]).toMatchObject({
        currency: bitcoin,
        amount: 0,
        accounts: [],
      });
    });

    it("should navigate to Asset detail on item press", () => {
      mockReadOnlyCoins.mockReturnValue({
        sortedCryptoCurrencies: [ethereum],
      });

      const { result } = renderHook(() =>
        usePortfolioCryptosSectionViewModel({ isReadOnly: true }),
      );

      act(() => {
        result.current.onItemPress(result.current.assetsToDisplay[0]);
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Accounts, {
        screen: ScreenName.Asset,
        params: { currency: ethereum },
      });
    });
  });
});
