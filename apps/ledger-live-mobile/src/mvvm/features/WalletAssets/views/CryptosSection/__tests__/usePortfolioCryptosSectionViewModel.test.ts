import { act } from "@testing-library/react-native";
import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { Asset } from "~/types/asset";
import usePortfolioCryptosSectionViewModel from "../usePortfolioCryptosSectionViewModel";
import { CategorizedAssets } from "@ledgerhq/asset-aggregation/assetCategorization/types";
import { bitcoin, ethereum, createCryptoAsset } from "./shared";

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
    mockAssetsData.mockReturnValue({ data: undefined, isLoading: false, isError: false });
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
    it("should navigate to Crypto screen when assetSection is enabled", () => {
      const { result } = renderHook(() => usePortfolioCryptosSectionViewModel(), {
        overrideInitialState: withFlagOverrides({ lwmWallet40: { enabled: true, params: { assetSection: true } } }),
      });

      act(() => {
        result.current.onPressShowAll();
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Accounts, {
        screen: ScreenName.Crypto,
        params: {
          sourceScreenName: ScreenName.Portfolio,
          variant: "crypto",
        },
      });
    });

    it("should navigate to legacy Assets screen when assetSection is disabled", () => {
      const { result } = renderHook(() => usePortfolioCryptosSectionViewModel(), {
        overrideInitialState: withFlagOverrides({ lwmWallet40: { enabled: true, params: { assetSection: false } } }),
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

  describe("variant: emptyState", () => {
    it("should always return hasMore false", () => {
      const { result } = renderHook(() =>
        usePortfolioCryptosSectionViewModel({ variant: "emptyState" }),
      );

      expect(result.current.hasMore).toBe(false);
    });
  });

  describe("default asset padding when user has fewer than 4 cryptos", () => {
    it("should show only user assets when user has 4 or more cryptos", () => {
      const fourCryptos = Array.from({ length: 4 }, () => createCryptoAsset(bitcoin, 1000));
      mockPortfolioWithCryptos(fourCryptos);

      const { result } = renderHook(() => usePortfolioCryptosSectionViewModel());

      expect(result.current.assetsToDisplay).toHaveLength(4);
      expect(result.current.assetsToDisplay.every(a => !a.isPlaceholder)).toBe(true);
    });

    it("should show user assets first, with no padding when defaults unavailable", () => {
      mockPortfolioWithCryptos([createCryptoAsset(bitcoin, 100000)]);

      const { result } = renderHook(() => usePortfolioCryptosSectionViewModel());

      expect(result.current.assetsToDisplay).toHaveLength(1);
      expect(result.current.assetsToDisplay[0].currency).toBe(bitcoin);
    });
  });

  describe("isReadOnly", () => {
    it("should return assets from useReadOnlyCoins", () => {
      mockReadOnlyCoins.mockReturnValue({
        sortedCryptoCurrencies: [bitcoin, ethereum],
      });

      const { result } = renderHook(() =>
        usePortfolioCryptosSectionViewModel({ variant: "readOnly" }),
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
        usePortfolioCryptosSectionViewModel({ variant: "readOnly" }),
      );

      expect(result.current.hasMore).toBe(true);
    });

    it("should navigate to legacy Assets screen on show all press", () => {
      mockReadOnlyCoins.mockReturnValue({
        sortedCryptoCurrencies: [bitcoin, ethereum],
      });

      const { result } = renderHook(() =>
        usePortfolioCryptosSectionViewModel({ variant: "readOnly" }),
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
        usePortfolioCryptosSectionViewModel({ variant: "readOnly" }),
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
        usePortfolioCryptosSectionViewModel({ variant: "readOnly" }),
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
