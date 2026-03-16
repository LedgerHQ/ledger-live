import { act } from "@testing-library/react-native";
import { renderHook } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { useDistribution } from "~/actions/general";
import { Asset } from "~/types/asset";
import { State } from "~/reducers/types";
import usePortfolioCryptosSectionViewModel from "../hooks/usePortfolioCryptosSectionViewModel";
import { bitcoin, ethereum, createCryptoAsset } from "./shared";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ name: "Portfolio" }),
}));

jest.mock("~/actions/general", () => ({
  ...jest.requireActual("~/actions/general"),
  useDistribution: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/dada-client/hooks/useAssetsData", () => ({
  useAssetsData: () => ({ data: undefined, isLoading: false }),
}));

const mockReadOnlyCoins = jest.fn();

jest.mock("~/hooks/useReadOnlyCoins", () => ({
  useReadOnlyCoins: (opts: { maxDisplayed: number }) => mockReadOnlyCoins(opts),
}));

const mockDistribution = (list: Asset[] = [], isAvailable = true) => {
  (useDistribution as jest.Mock).mockReturnValue({ isAvailable, list });
};

describe("usePortfolioCryptosSectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDistribution();
    mockReadOnlyCoins.mockReturnValue({ sortedCryptoCurrencies: [] });
  });

  describe("asset filtering and display", () => {
    it("should return empty assets when distribution is not available", () => {
      mockDistribution([], false);

      const { result } = renderHook(() => usePortfolioCryptosSectionViewModel());

      expect(result.current.assetsCount).toBe(0);
      expect(result.current.assetsToDisplay).toHaveLength(0);
    });

    it("should return all assets when fewer than 6 are available", () => {
      const mockAssets = [createCryptoAsset(bitcoin, 100000), createCryptoAsset(ethereum, 2000)];
      mockDistribution(mockAssets);

      const { result } = renderHook(() => usePortfolioCryptosSectionViewModel());

      expect(result.current.assetsCount).toBe(2);
      expect(result.current.assetsToDisplay).toHaveLength(2);
    });

    it("should limit displayed assets to 6 while showing the total count", () => {
      const mockAssets = Array.from({ length: 10 }, (_, i) =>
        createCryptoAsset(bitcoin, 10000 * (10 - i)),
      );
      mockDistribution(mockAssets);

      const { result } = renderHook(() => usePortfolioCryptosSectionViewModel());

      expect(result.current.assetsCount).toBe(10);
      expect(result.current.assetsToDisplay).toHaveLength(6);
    });
  });

  describe("hasMore", () => {
    it("should be false when there are 6 assets or fewer", () => {
      const mockAssets = Array.from({ length: 6 }, (_, i) =>
        createCryptoAsset(bitcoin, 10000 * (6 - i)),
      );
      mockDistribution(mockAssets);

      const { result } = renderHook(() => usePortfolioCryptosSectionViewModel());

      expect(result.current.hasMore).toBe(false);
    });

    it("should be true when there are more than 6 assets", () => {
      const mockAssets = Array.from({ length: 7 }, (_, i) =>
        createCryptoAsset(bitcoin, 10000 * (7 - i)),
      );
      mockDistribution(mockAssets);

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
      const mockAsset = createCryptoAsset(ethereum, 5000);
      const { result } = renderHook(() => usePortfolioCryptosSectionViewModel());

      act(() => {
        result.current.onItemPress(mockAsset);
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
