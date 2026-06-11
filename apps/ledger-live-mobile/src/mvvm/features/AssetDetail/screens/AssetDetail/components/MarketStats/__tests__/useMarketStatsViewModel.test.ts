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
    ledgerIds: ["bitcoin"],
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
      const { result } = renderHook(() =>
        useMarketStatsViewModel({ currency: mockBtcCryptoCurrency }),
      );

      expect(result.current.stats).toHaveLength(5);
      expect(result.current.stats[0].label).toMatch(/market cap/i);
      expect(result.current.stats[1].label).toMatch(/market rank/i);
      expect(result.current.stats[2].label).toMatch(/circulating supply/i);
      expect(result.current.stats[3].label).toMatch(/max supply/i);
      expect(result.current.stats[4].label).toMatch(/trading volume/i);
    });

    it("formats market rank with # prefix", () => {
      const { result } = renderHook(() =>
        useMarketStatsViewModel({ currency: mockBtcCryptoCurrency }),
      );

      const rankStat = result.current.stats.find(s => s.key === "market_rank");
      expect(rankStat?.value).toBe("#1");
    });

    it("provides tooltip for every stat row except market rank", () => {
      const { result } = renderHook(() =>
        useMarketStatsViewModel({ currency: mockBtcCryptoCurrency }),
      );

      const withTooltip = result.current.stats.filter(s => s.tooltip);
      expect(withTooltip.map(s => s.key)).toEqual([
        "market_cap",
        "circulating_supply",
        "max_supply",
        "trading_volume",
      ]);
      expect(result.current.stats.find(s => s.key === "market_rank")?.tooltip).toBeUndefined();
    });

    it("returns an empty array when no market data", () => {
      mockMarketData({ marketCurrency: undefined });

      const { result } = renderHook(() =>
        useMarketStatsViewModel({ currency: mockBtcCryptoCurrency }),
      );

      expect(result.current.stats).toEqual([]);
    });

    it("returns '-' for missing values", () => {
      mockMarketData({
        marketCurrency: { ...marketCurrencyData, marketcap: undefined } as any,
      });

      const { result } = renderHook(() =>
        useMarketStatsViewModel({ currency: mockBtcCryptoCurrency }),
      );

      expect(result.current.stats.find(s => s.key === "market_cap")?.value).toBe("-");
    });

    it("returns the ∞ symbol for max supply when the coin is uncapped but has market data", () => {
      mockMarketData({
        marketCurrency: { ...marketCurrencyData, maxSupply: 0 } as any,
      });

      const { result } = renderHook(() =>
        useMarketStatsViewModel({ currency: mockBtcCryptoCurrency }),
      );

      expect(result.current.stats.find(s => s.key === "max_supply")?.value).toBe("∞");
    });

    it("returns '-' for max supply when no supply data is available", () => {
      mockMarketData({
        marketCurrency: { ...marketCurrencyData, maxSupply: 0, circulatingSupply: 0 } as any,
      });

      const { result } = renderHook(() =>
        useMarketStatsViewModel({ currency: mockBtcCryptoCurrency }),
      );

      expect(result.current.stats.find(s => s.key === "max_supply")?.value).toBe("-");
    });

    it("formats supply rows with the ticker suffix from market data", () => {
      const { result } = renderHook(() =>
        useMarketStatsViewModel({ currency: mockBtcCryptoCurrency }),
      );

      const circulating = result.current.stats.find(s => s.key === "circulating_supply")?.value;
      const maxSupply = result.current.stats.find(s => s.key === "max_supply")?.value;

      expect(circulating).toMatch(/BTC$/);
      expect(maxSupply).toMatch(/BTC$/);
      expect(circulating).not.toMatch(/^\d+$/);
    });

    it("falls back to the currency prop ticker when market data ticker is missing", () => {
      mockMarketData({
        marketCurrency: { ...marketCurrencyData, ticker: "" } as any,
      });

      const { result } = renderHook(() =>
        useMarketStatsViewModel({ currency: mockBtcCryptoCurrency }),
      );

      const circulating = result.current.stats.find(s => s.key === "circulating_supply")?.value;
      expect(circulating).toMatch(/BTC$/);
    });

    it("never renders a raw unformatted integer for very large supply values", () => {
      mockMarketData({
        marketCurrency: { ...marketCurrencyData, circulatingSupply: 124329543825 } as any,
      });

      const { result } = renderHook(() =>
        useMarketStatsViewModel({ currency: mockBtcCryptoCurrency }),
      );

      const circulating = result.current.stats.find(s => s.key === "circulating_supply")?.value;
      expect(circulating).not.toBe("124329543825");
      expect(circulating).toMatch(/BTC$/);
    });
  });

  describe("loading state", () => {
    it("reflects isFetching from the query", () => {
      mockMarketData({ marketCurrency: undefined, isLoading: true });

      const { result } = renderHook(() =>
        useMarketStatsViewModel({ currency: mockBtcCryptoCurrency }),
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.hasData).toBe(false);
    });
  });

  describe("error state", () => {
    it("reflects isError from the query", () => {
      mockMarketData({ marketCurrency: undefined, isError: true });

      const { result } = renderHook(() =>
        useMarketStatsViewModel({ currency: mockBtcCryptoCurrency }),
      );

      expect(result.current.isError).toBe(true);
    });
  });

  describe("onTooltipOpen", () => {
    it("tracks button_clicked with market_stat_definition when tooltip opens", () => {
      const { result } = renderHook(() =>
        useMarketStatsViewModel({ currency: mockBtcCryptoCurrency }),
      );

      result.current.onTooltipOpen("circulating_supply", true);

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "market_stat_definition",
        currency: "bitcoin",
        type: "circulating_supply",
        page: "Asset Detail",
      });
    });

    it("does not track when tooltip closes", () => {
      const { result } = renderHook(() =>
        useMarketStatsViewModel({ currency: mockBtcCryptoCurrency }),
      );

      result.current.onTooltipOpen("circulating_supply", false);

      expect(track).not.toHaveBeenCalled();
    });
  });

  describe("skip query", () => {
    it("passes resolved ids through to useAssetMarketData when no overrides are provided", () => {
      renderHook(() => useMarketStatsViewModel({ currency: undefined }));

      expect(mockUseAssetMarketData).toHaveBeenCalledWith(
        expect.objectContaining({
          marketApiId: undefined,
          knownLedgerIds: undefined,
        }),
      );
    });
  });
});
