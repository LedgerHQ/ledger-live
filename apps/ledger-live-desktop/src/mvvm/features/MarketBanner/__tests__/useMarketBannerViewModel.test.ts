import { renderHook, withFlagOverrides } from "tests/testSetup";
import {
  usePerformersBannerItems,
  useFavoritesBannerItems,
  useTrendingBannerItems,
  useMarketBannerViewModel,
} from "../hooks/useMarketBannerViewModel";
import { useMarketPerformers } from "@ledgerhq/live-common/market/hooks/useMarketPerformers";
import { useTrendingPerformers } from "@ledgerhq/live-common/market/hooks/useTrendingPerformers";
import { useMarketData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import {
  MOCK_MARKET_PERFORMERS,
  createMockMarketCurrencyData,
  createMockMarketPerformer,
} from "@ledgerhq/live-common/market/utils/fixtures";
import { MarketItemPerformer, MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { selectMarketBannerRanking } from "~/renderer/reducers/marketBanner";
import { MARKET_BANNER_ITEMS_COUNT } from "../utils/constants";

jest.mock("@ledgerhq/live-common/market/hooks/useMarketPerformers");
jest.mock("@ledgerhq/live-common/market/hooks/useTrendingPerformers");
jest.mock("@ledgerhq/live-common/market/hooks/useMarketDataProvider");
jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog");
jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index");

const assetDiscoverabilityOn = withFlagOverrides({
  lwdWallet40: { enabled: true, params: { assetDiscoverability: true } },
});

const assetDiscoverabilityOff = withFlagOverrides({
  lwdWallet40: { enabled: false },
});

const mockedUseMarketPerformers = jest.mocked(useMarketPerformers);
const mockedUseTrendingPerformers = jest.mocked(useTrendingPerformers);
const mockedUseMarketData = jest.mocked(useMarketData);

function mockPerformersQuery(
  overrides: Partial<{
    data: MarketItemPerformer[];
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
  }>,
) {
  mockedUseMarketPerformers.mockReturnValue({
    data: undefined,
    isLoading: false,
    isFetching: false,
    isError: false,
    ...overrides,
  } as ReturnType<typeof useMarketPerformers>);
}

function mockTrendingQuery(
  overrides: Partial<{
    data: MarketItemPerformer[];
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
  }>,
) {
  mockedUseTrendingPerformers.mockReturnValue({
    data: undefined,
    isLoading: false,
    isFetching: false,
    isError: false,
    ...overrides,
  } as ReturnType<typeof useTrendingPerformers>);
}

function mockMarketDataQuery(
  overrides: Partial<{
    data: MarketCurrencyData[];
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
  }>,
) {
  mockedUseMarketData.mockReturnValue({
    data: [],
    isPending: false,
    isLoading: false,
    isFetching: false,
    isError: false,
    cachedMetadataMap: new Map(),
    ...overrides,
  } as ReturnType<typeof useMarketData>);
}

describe("MarketBanner view models", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // The view model always calls every ranking hook (skipping the inactive ones), so provide a
    // safe default for trending to avoid destructuring an undefined query result.
    mockTrendingQuery({});

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    jest.mocked(useRampCatalog).mockReturnValue({
      isCurrencyAvailable: () => true,
    } as unknown as ReturnType<typeof useRampCatalog>);

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    jest.mocked(useFetchCurrencyAll).mockReturnValue({
      data: ["bitcoin", "ethereum", "solana"],
    } as unknown as ReturnType<typeof useFetchCurrencyAll>);
  });

  describe("usePerformersBannerItems", () => {
    describe("isLoading", () => {
      it("should be true during the initial load (no cached data)", () => {
        mockPerformersQuery({ isLoading: true, isFetching: true });

        const { result } = renderHook(() => usePerformersBannerItems("gainers"));

        expect(result.current.isLoading).toBe(true);
        expect(result.current.items).toEqual([]);
      });

      it("should be true when fetching without any cached data", () => {
        mockPerformersQuery({ isFetching: true });

        const { result } = renderHook(() => usePerformersBannerItems("gainers"));

        expect(result.current.isLoading).toBe(true);
      });

      it("should be false during a background refetch when data already exists", () => {
        mockPerformersQuery({ data: MOCK_MARKET_PERFORMERS, isFetching: true });

        const { result } = renderHook(() => usePerformersBannerItems("gainers"));

        expect(result.current.isLoading).toBe(false);
        expect(result.current.items.length).toBeGreaterThan(0);
      });

      it("should be false when data is loaded and the query is idle", () => {
        mockPerformersQuery({ data: MOCK_MARKET_PERFORMERS });

        const { result } = renderHook(() => usePerformersBannerItems("gainers"));

        expect(result.current.isLoading).toBe(false);
        expect(result.current.items.length).toBeGreaterThan(0);
      });
    });

    describe("isError", () => {
      it("should be true when the query errors and is not refetching", () => {
        mockPerformersQuery({ isError: true });

        const { result } = renderHook(() => usePerformersBannerItems("gainers"));

        expect(result.current.isError).toBe(true);
      });

      it("should be suppressed while a refetch is in progress", () => {
        mockPerformersQuery({ isError: true, isFetching: true });

        const { result } = renderHook(() => usePerformersBannerItems("gainers"));

        expect(result.current.isError).toBe(false);
      });
    });

    describe("ranking → sort mapping", () => {
      it("should request ascending order for gainers", () => {
        mockPerformersQuery({ data: MOCK_MARKET_PERFORMERS });

        renderHook(() => usePerformersBannerItems("gainers"));

        expect(mockedUseMarketPerformers).toHaveBeenCalledWith(
          expect.objectContaining({ sort: "asc" }),
          expect.anything(),
        );
      });

      it("should request descending order for losers", () => {
        mockPerformersQuery({ data: MOCK_MARKET_PERFORMERS });

        renderHook(() => usePerformersBannerItems("losers"));

        expect(mockedUseMarketPerformers).toHaveBeenCalledWith(
          expect.objectContaining({ sort: "desc" }),
          expect.anything(),
        );
      });
    });
  });

  describe("useFavoritesBannerItems", () => {
    it("should bypass availability filtering and keep coins that are not tradeable", () => {
      const available = createMockMarketCurrencyData({ id: "bitcoin", ledgerIds: ["bitcoin"] });
      const notTradeable = createMockMarketCurrencyData({
        id: "some-token",
        ledgerIds: ["some-token"],
      });
      mockMarketDataQuery({ data: [available, notTradeable] });

      // Restrict availability to bitcoin only: if the favorites path ever applied
      // filterMarketPerformersByAvailability, `some-token` would be dropped and this
      // assertion would fail. Keeping both proves the filter is bypassed.
      jest.mocked(useRampCatalog).mockReturnValue({
        isCurrencyAvailable: (id: string) => id === "bitcoin",
      } as unknown as ReturnType<typeof useRampCatalog>);
      jest.mocked(useFetchCurrencyAll).mockReturnValue({
        data: ["bitcoin"],
      } as unknown as ReturnType<typeof useFetchCurrencyAll>);

      const { result } = renderHook(() => useFavoritesBannerItems(), {
        initialState: { settings: { starredMarketCoins: ["bitcoin", "some-token"] } },
      });

      expect(result.current.items.map(item => item.id)).toEqual(["bitcoin", "some-token"]);
    });

    it("should not query the list endpoint when there are no starred coins", () => {
      mockMarketDataQuery({});

      const { result } = renderHook(() => useFavoritesBannerItems(), {
        initialState: { settings: { starredMarketCoins: [] } },
      });

      expect(mockedUseMarketData).toHaveBeenCalledWith(
        expect.objectContaining({ starred: [] }),
        expect.objectContaining({ enabled: false }),
      );
      expect(result.current.items).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it("should cap the result to MARKET_BANNER_ITEMS_COUNT", () => {
      const data = Array.from({ length: MARKET_BANNER_ITEMS_COUNT + 5 }, (_, i) =>
        createMockMarketCurrencyData({ id: `coin-${i}` }),
      );
      mockMarketDataQuery({ data });

      const { result } = renderHook(() => useFavoritesBannerItems());

      expect(result.current.items).toHaveLength(MARKET_BANNER_ITEMS_COUNT);
    });

    it("should be loading on first fetch and surface errors when not refetching", () => {
      mockMarketDataQuery({ isLoading: true });
      const { result: loading } = renderHook(() => useFavoritesBannerItems());
      expect(loading.current.isLoading).toBe(true);

      mockMarketDataQuery({ isError: true });
      const { result: errored } = renderHook(() => useFavoritesBannerItems());
      expect(errored.current.isError).toBe(true);
    });
  });

  describe("useTrendingBannerItems", () => {
    it("caps the result to MARKET_BANNER_ITEMS_COUNT and preserves order", () => {
      const data = Array.from({ length: MARKET_BANNER_ITEMS_COUNT + 5 }, (_, i) =>
        createMockMarketPerformer({ id: `coin-${i}` }),
      );
      mockTrendingQuery({ data });

      const { result } = renderHook(() => useTrendingBannerItems());

      expect(result.current.items).toHaveLength(MARKET_BANNER_ITEMS_COUNT);
      expect(result.current.items[0].id).toBe("coin-0");
    });

    it("does not apply availability filtering", () => {
      const notTradeable = createMockMarketPerformer({
        id: "some-token",
        ledgerIds: ["some-token"],
      });
      mockTrendingQuery({ data: [notTradeable] });

      jest.mocked(useRampCatalog).mockReturnValue({
        isCurrencyAvailable: () => false,
      } as unknown as ReturnType<typeof useRampCatalog>);
      jest.mocked(useFetchCurrencyAll).mockReturnValue({
        data: [],
      } as unknown as ReturnType<typeof useFetchCurrencyAll>);

      const { result } = renderHook(() => useTrendingBannerItems());

      expect(result.current.items.map(item => item.id)).toEqual(["some-token"]);
    });

    it("is loading on first fetch and surfaces errors when not refetching", () => {
      mockTrendingQuery({ isLoading: true, isFetching: true });
      const { result: loading } = renderHook(() => useTrendingBannerItems());
      expect(loading.current.isLoading).toBe(true);

      mockTrendingQuery({ isError: true });
      const { result: errored } = renderHook(() => useTrendingBannerItems());
      expect(errored.current.isError).toBe(true);
    });
  });

  describe("useMarketBannerViewModel", () => {
    it("returns favorites data and skips the performers query when ranking is favorites", () => {
      mockPerformersQuery({ data: MOCK_MARKET_PERFORMERS });
      mockMarketDataQuery({ data: [createMockMarketCurrencyData({ id: "bitcoin" })] });

      const { result } = renderHook(() => useMarketBannerViewModel(), {
        initialState: {
          ...assetDiscoverabilityOn,
          marketBanner: { ranking: "favorites" },
          settings: { starredMarketCoins: ["bitcoin"] },
        },
      });

      expect(mockedUseMarketPerformers).toHaveBeenCalledWith(expect.anything(), { skip: true });
      expect(result.current.items.map(item => item.id)).toEqual(["bitcoin"]);
    });

    it("resets a stale favorites ranking to trending and runs the trending query when no coin is starred", () => {
      mockPerformersQuery({});
      mockTrendingQuery({ data: MOCK_MARKET_PERFORMERS });
      mockMarketDataQuery({});

      const { result, store } = renderHook(() => useMarketBannerViewModel(), {
        initialState: {
          ...assetDiscoverabilityOn,
          marketBanner: { ranking: "favorites" },
          settings: { starredMarketCoins: [] },
        },
      });

      expect(selectMarketBannerRanking(store.getState())).toBe("trending");
      expect(mockedUseTrendingPerformers).toHaveBeenCalledWith(expect.anything(), { skip: false });
      expect(mockedUseMarketPerformers).toHaveBeenCalledWith(expect.anything(), { skip: true });
      expect(mockedUseMarketData).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ enabled: false }),
      );
      expect(result.current.items.length).toBeGreaterThan(0);
    });

    it("returns trending data and skips the performers and favorites queries when ranking is trending", () => {
      mockPerformersQuery({});
      mockTrendingQuery({ data: MOCK_MARKET_PERFORMERS });
      mockMarketDataQuery({});

      const { result } = renderHook(() => useMarketBannerViewModel(), {
        initialState: {
          ...assetDiscoverabilityOn,
          marketBanner: { ranking: "trending" },
        },
      });

      expect(mockedUseTrendingPerformers).toHaveBeenCalledWith(expect.anything(), { skip: false });
      expect(mockedUseMarketPerformers).toHaveBeenCalledWith(expect.anything(), { skip: true });
      expect(mockedUseMarketData).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ enabled: false }),
      );
      expect(result.current.items.length).toBeGreaterThan(0);
    });

    it("falls back to the gainers performers query when the trending query errors", () => {
      mockTrendingQuery({ isError: true });
      mockPerformersQuery({ data: MOCK_MARKET_PERFORMERS });
      mockMarketDataQuery({});

      const { result } = renderHook(() => useMarketBannerViewModel(), {
        initialState: {
          ...assetDiscoverabilityOn,
          marketBanner: { ranking: "trending" },
        },
      });

      // Fallback active: the performers query is enabled with the ascending (gainers) sort.
      expect(mockedUseMarketPerformers).toHaveBeenCalledWith(
        expect.objectContaining({ sort: "asc" }),
        { skip: false },
      );
      expect(result.current.items.length).toBeGreaterThan(0);
    });

    it("keeps the favorites ranking when at least one coin is starred", () => {
      mockPerformersQuery({ data: MOCK_MARKET_PERFORMERS });
      mockMarketDataQuery({ data: [createMockMarketCurrencyData({ id: "bitcoin" })] });

      const { store } = renderHook(() => useMarketBannerViewModel(), {
        initialState: {
          ...assetDiscoverabilityOn,
          marketBanner: { ranking: "favorites" },
          settings: { starredMarketCoins: ["bitcoin"] },
        },
      });

      expect(selectMarketBannerRanking(store.getState())).toBe("favorites");
    });

    it("returns performers data and disables the favorites query for a performers ranking", () => {
      mockPerformersQuery({ data: MOCK_MARKET_PERFORMERS });
      mockMarketDataQuery({});

      const { result } = renderHook(() => useMarketBannerViewModel(), {
        initialState: {
          ...assetDiscoverabilityOn,
          marketBanner: { ranking: "losers" },
        },
      });

      expect(mockedUseMarketData).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ enabled: false }),
      );
      expect(mockedUseMarketPerformers).toHaveBeenCalledWith(
        expect.objectContaining({ sort: "desc" }),
        { skip: false },
      );
      expect(result.current.items.length).toBeGreaterThan(0);
    });

    describe("asset discoverability feature flag", () => {
      it("uses the persisted ranking when the flag is enabled", () => {
        mockPerformersQuery({ data: MOCK_MARKET_PERFORMERS });
        mockMarketDataQuery({ data: [createMockMarketCurrencyData({ id: "bitcoin" })] });

        renderHook(() => useMarketBannerViewModel(), {
          initialState: {
            ...assetDiscoverabilityOn,
            marketBanner: { ranking: "favorites" },
            settings: { starredMarketCoins: ["bitcoin"] },
          },
        });

        // favorites ranking is honored: performers query is skipped, favorites query runs
        expect(mockedUseMarketPerformers).toHaveBeenCalledWith(expect.anything(), { skip: true });
        expect(mockedUseMarketData).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ enabled: true }),
        );
      });

      it("falls back to the default ranking and ignores the persisted ranking when the flag is disabled", () => {
        mockPerformersQuery({ data: MOCK_MARKET_PERFORMERS });
        mockMarketDataQuery({ data: [createMockMarketCurrencyData({ id: "bitcoin" })] });

        const { result } = renderHook(() => useMarketBannerViewModel(), {
          initialState: {
            ...assetDiscoverabilityOff,
            marketBanner: { ranking: "favorites" },
            settings: { starredMarketCoins: ["bitcoin"] },
          },
        });

        expect(mockedUseMarketPerformers).toHaveBeenCalledWith(
          expect.objectContaining({ sort: "asc" }),
          { skip: false },
        );
        expect(mockedUseMarketData).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ enabled: false }),
        );
        expect(result.current.items.length).toBeGreaterThan(0);
      });
    });
  });
});
