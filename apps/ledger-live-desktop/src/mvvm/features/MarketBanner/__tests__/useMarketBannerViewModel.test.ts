import { renderHook } from "tests/testSetup";
import {
  usePerformersBannerItems,
  useFavoritesBannerItems,
  useMarketBannerViewModel,
} from "../hooks/useMarketBannerViewModel";
import { useMarketPerformers } from "@ledgerhq/live-common/market/hooks/useMarketPerformers";
import { useMarketData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import {
  MOCK_MARKET_PERFORMERS,
  createMockMarketCurrencyData,
} from "@ledgerhq/live-common/market/utils/fixtures";
import { MarketItemPerformer, MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { MARKET_BANNER_ITEMS_COUNT } from "../utils/constants";

jest.mock("@ledgerhq/live-common/market/hooks/useMarketPerformers");
jest.mock("@ledgerhq/live-common/market/hooks/useMarketDataProvider");
jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog");
jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index");

const mockedUseMarketPerformers = jest.mocked(useMarketPerformers);
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

        const { result } = renderHook(() => usePerformersBannerItems("trending"));

        expect(result.current.isLoading).toBe(true);
        expect(result.current.items).toEqual([]);
      });

      it("should be true when fetching without any cached data", () => {
        mockPerformersQuery({ isFetching: true });

        const { result } = renderHook(() => usePerformersBannerItems("trending"));

        expect(result.current.isLoading).toBe(true);
      });

      it("should be false during a background refetch when data already exists", () => {
        mockPerformersQuery({ data: MOCK_MARKET_PERFORMERS, isFetching: true });

        const { result } = renderHook(() => usePerformersBannerItems("trending"));

        expect(result.current.isLoading).toBe(false);
        expect(result.current.items.length).toBeGreaterThan(0);
      });

      it("should be false when data is loaded and the query is idle", () => {
        mockPerformersQuery({ data: MOCK_MARKET_PERFORMERS });

        const { result } = renderHook(() => usePerformersBannerItems("trending"));

        expect(result.current.isLoading).toBe(false);
        expect(result.current.items.length).toBeGreaterThan(0);
      });
    });

    describe("isError", () => {
      it("should be true when the query errors and is not refetching", () => {
        mockPerformersQuery({ isError: true });

        const { result } = renderHook(() => usePerformersBannerItems("trending"));

        expect(result.current.isError).toBe(true);
      });

      it("should be suppressed while a refetch is in progress", () => {
        mockPerformersQuery({ isError: true, isFetching: true });

        const { result } = renderHook(() => usePerformersBannerItems("trending"));

        expect(result.current.isError).toBe(false);
      });
    });

    describe("ranking → sort mapping", () => {
      it.each(["trending", "gainers"] as const)(
        "should request ascending order for %s",
        ranking => {
          mockPerformersQuery({ data: MOCK_MARKET_PERFORMERS });

          renderHook(() => usePerformersBannerItems(ranking));

          expect(mockedUseMarketPerformers).toHaveBeenCalledWith(
            expect.objectContaining({ sort: "asc" }),
            expect.anything(),
          );
        },
      );

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

  describe("useMarketBannerViewModel", () => {
    it("returns favorites data and skips the performers query when ranking is favorites", () => {
      mockPerformersQuery({ data: MOCK_MARKET_PERFORMERS });
      mockMarketDataQuery({ data: [createMockMarketCurrencyData({ id: "bitcoin" })] });

      const { result } = renderHook(() => useMarketBannerViewModel(), {
        initialState: {
          marketBanner: { ranking: "favorites" },
          settings: { starredMarketCoins: ["bitcoin"] },
        },
      });

      expect(mockedUseMarketPerformers).toHaveBeenCalledWith(expect.anything(), { skip: true });
      expect(result.current.items.map(item => item.id)).toEqual(["bitcoin"]);
    });

    it("returns performers data and disables the favorites query for a performers ranking", () => {
      mockPerformersQuery({ data: MOCK_MARKET_PERFORMERS });
      mockMarketDataQuery({});

      const { result } = renderHook(() => useMarketBannerViewModel(), {
        initialState: { marketBanner: { ranking: "losers" } },
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
  });
});
