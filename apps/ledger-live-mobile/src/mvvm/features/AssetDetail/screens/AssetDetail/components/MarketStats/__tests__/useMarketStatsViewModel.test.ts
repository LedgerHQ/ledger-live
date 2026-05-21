import { renderHook } from "@tests/test-renderer";
import { useMarketStatsViewModel } from "../useMarketStatsViewModel";
import { track } from "~/analytics";
import { useAssetMarketData } from "../../../hooks/useAssetMarketData";
import { mockBtcCryptoCurrency } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { marketCurrencyData } from "../../../__fixtures__/marketCurrencyData";

jest.mock("../../../hooks/useAssetMarketData");

const mockUseAssetMarketData = jest.mocked(useAssetMarketData);

function mockMarketData(overrides?: Partial<ReturnType<typeof useAssetMarketData>>) {
  mockUseAssetMarketData.mockReturnValue({
    marketCurrency: marketCurrencyData as any,
    marketId: "bitcoin",
    counterCurrency: "usd",
    isLoading: false,
    isError: false,
    ...overrides,
  });
}

describe("useMarketStatsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMarketData();
  });

  describe("stats", () => {
    it("returns 5 stat rows with correct labels", () => {
      const { result } = renderHook(() => useMarketStatsViewModel(mockBtcCryptoCurrency));

      expect(result.current.stats).toHaveLength(5);
      expect(result.current.stats[0].label).toMatch(/market cap/i);
      expect(result.current.stats[1].label).toMatch(/market rank/i);
      expect(result.current.stats[2].label).toMatch(/circulating supply/i);
      expect(result.current.stats[3].label).toMatch(/max supply/i);
      expect(result.current.stats[4].label).toMatch(/trading volume/i);
    });

    it("formats market rank with # prefix", () => {
      const { result } = renderHook(() => useMarketStatsViewModel(mockBtcCryptoCurrency));

      const rankStat = result.current.stats.find(s => s.key === "market_rank");
      expect(rankStat?.value).toBe("#1");
    });

    it("provides tooltip only for circulating supply and max supply", () => {
      const { result } = renderHook(() => useMarketStatsViewModel(mockBtcCryptoCurrency));

      const withTooltip = result.current.stats.filter(s => s.tooltip);
      expect(withTooltip).toHaveLength(2);
      expect(withTooltip.map(s => s.key)).toEqual(["circulating_supply", "max_supply"]);
    });

    it("returns an empty array when no market data", () => {
      mockMarketData({ marketCurrency: undefined });

      const { result } = renderHook(() => useMarketStatsViewModel(mockBtcCryptoCurrency));

      expect(result.current.stats).toEqual([]);
    });

    it("returns '-' for missing values", () => {
      mockMarketData({
        marketCurrency: { ...marketCurrencyData, marketcap: undefined, maxSupply: 0 } as any,
      });

      const { result } = renderHook(() => useMarketStatsViewModel(mockBtcCryptoCurrency));

      expect(result.current.stats.find(s => s.key === "market_cap")?.value).toBe("-");
      expect(result.current.stats.find(s => s.key === "max_supply")?.value).toBe("-");
    });
  });

  describe("loading state", () => {
    it("reflects isFetching from the query", () => {
      mockMarketData({ marketCurrency: undefined, isLoading: true });

      const { result } = renderHook(() => useMarketStatsViewModel(mockBtcCryptoCurrency));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.hasData).toBe(false);
    });
  });

  describe("error state", () => {
    it("reflects isError from the query", () => {
      mockMarketData({ marketCurrency: undefined, isError: true });

      const { result } = renderHook(() => useMarketStatsViewModel(mockBtcCryptoCurrency));

      expect(result.current.isError).toBe(true);
    });
  });

  describe("onTooltipOpen", () => {
    it("tracks info_bubble_pressed when tooltip opens", () => {
      const { result } = renderHook(() => useMarketStatsViewModel(mockBtcCryptoCurrency));

      result.current.onTooltipOpen("circulating_supply", true);

      expect(track).toHaveBeenCalledWith("info_bubble_pressed", {
        currency: "bitcoin",
        stat_name: "circulating_supply",
        page: "Asset Detail",
      });
    });

    it("does not track when tooltip closes", () => {
      const { result } = renderHook(() => useMarketStatsViewModel(mockBtcCryptoCurrency));

      result.current.onTooltipOpen("circulating_supply", false);

      expect(track).not.toHaveBeenCalled();
    });
  });

  describe("skip query", () => {
    it("passes undefined currency to useAssetMarketData", () => {
      renderHook(() => useMarketStatsViewModel(undefined));

      expect(mockUseAssetMarketData).toHaveBeenCalledWith(undefined);
    });
  });
});
