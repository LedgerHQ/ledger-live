import React from "react";
import { renderHook } from "tests/testSetup";
import { createMockMarketCurrencyData } from "@ledgerhq/live-common/market/utils/fixtures";
import { MarketDataSectionCurrencyProvider } from "../MarketDataSectionCurrencyContext";
import type { MarketDataSectionCurrencyData } from "../hooks/useMarketDataSectionCurrencyData";
import { useMarketStatsViewModel } from "../MarketStats/hooks/useMarketStatsViewModel";
import { usePricePerformanceViewModel } from "../PricePerformance/hooks/usePricePerformanceViewModel";

jest.mock("~/renderer/hooks/useDateFormatter", () => ({
  ...jest.requireActual("~/renderer/hooks/useDateFormatter"),
  useDateFormatter: jest.fn(() => () => "Nov 10, 2021"),
  fromNow: jest.fn(() => "2 years ago"),
}));

function wrapWithCurrencyData(overrides: Partial<MarketDataSectionCurrencyData> = {}) {
  const value: MarketDataSectionCurrencyData = {
    data: createMockMarketCurrencyData({ marketcapRank: 1 }),
    showSkeleton: false,
    counterCurrency: "usd",
    locale: "en-US",
    ...overrides,
  };

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(MarketDataSectionCurrencyProvider, { value, children });
  };
}

const hookOptions = (overrides?: Partial<MarketDataSectionCurrencyData>) => ({
  minimal: false as const,
  initialState: { settings: { counterValue: "USD" } },
  wrapper: wrapWithCurrencyData(overrides),
});

describe("useMarketStatsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a skeleton while the shared context reports loading", () => {
    const { result } = renderHook(() => useMarketStatsViewModel(), {
      ...hookOptions({ showSkeleton: true, data: undefined }),
    });

    expect(result.current.showSkeleton).toBe(true);
  });

  it("hides the skeleton once context has data", () => {
    const { result } = renderHook(() => useMarketStatsViewModel(), hookOptions());

    expect(result.current.showSkeleton).toBe(false);
  });

  it("formats market rank with a sharp sign when CoinGecko rank is positive", () => {
    const { result } = renderHook(() => useMarketStatsViewModel(), {
      ...hookOptions({
        data: createMockMarketCurrencyData({ marketcapRank: 3 }),
      }),
    });
    const rankRow = result.current.rows.find(r => r.key === "market_rank");

    expect(rankRow?.value).toBe("#3");
  });

  it("uses a hyphen for zero marketcap rank to match counter value placeholders", () => {
    const { result } = renderHook(() => useMarketStatsViewModel(), {
      ...hookOptions({
        data: createMockMarketCurrencyData({ marketcapRank: 0 }),
      }),
    });

    expect(result.current.rows.find(r => r.key === "market_rank")?.value).toBe("-");
  });

  it("lists fixed stat rows in design order", () => {
    const { result } = renderHook(() => useMarketStatsViewModel(), hookOptions());

    expect(result.current.rows.map(r => r.key)).toEqual([
      "market_cap",
      "market_rank",
      "circulating_supply",
      "max_supply",
      "trading_volume_24h",
    ]);
  });

  it("exposes translated section header strings from the view model", () => {
    const { result } = renderHook(() => useMarketStatsViewModel(), hookOptions());

    expect(result.current.sectionTitle).toBeTruthy();
    expect(result.current.sectionTooltip).toBeTruthy();
  });
});

describe("usePricePerformanceViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders ATH change vs current price as a percentage", () => {
    const { result } = renderHook(() => usePricePerformanceViewModel(), {
      ...hookOptions({
        data: createMockMarketCurrencyData({
          price: 50_000,
          ath: 69_000,
          athDate: new Date("2021-11-10T00:00:00.000Z"),
          atl: 67.81,
          atlDate: new Date("2013-07-06T00:00:00.000Z"),
          low24h: 49_000,
          high24h: 51_000,
        }),
      }),
    });

    expect(result.current.athBlock.changeText).not.toBe("-");
    expect(result.current.athBlock.changeText).toMatch(/^-/);
    expect(result.current.athBlock.changeText).toMatch(/%$/);
  });

  it("uses hyphen change text when ATH is zero so the ratio is undefined", () => {
    const { result } = renderHook(() => usePricePerformanceViewModel(), {
      ...hookOptions({
        data: createMockMarketCurrencyData({ price: 50_000, ath: 0 }),
      }),
    });

    expect(result.current.athBlock.changeText).toBe("-");
  });

  it("shows a skeleton while context reports fetching without cached data", () => {
    const { result } = renderHook(() => usePricePerformanceViewModel(), {
      ...hookOptions({ showSkeleton: true, data: undefined }),
    });

    expect(result.current.showSkeleton).toBe(true);
  });

  it("combines mocked long-date and relative parts for ATH line", () => {
    const { result } = renderHook(() => usePricePerformanceViewModel(), {
      ...hookOptions({
        data: createMockMarketCurrencyData({
          athDate: new Date("2021-11-10T00:00:00.000Z"),
        }),
      }),
    });

    expect(result.current.athBlock.dateLine).toBe("Nov 10, 2021 (2 years ago)");
  });

  it("falls back title keys for ATH and ATL sections", () => {
    const { result } = renderHook(() => usePricePerformanceViewModel(), hookOptions());

    expect(result.current.athBlock.title).toBeTruthy();
    expect(result.current.atlBlock.title).toBeTruthy();
    expect(result.current.athBlock.title).not.toBe(result.current.atlBlock.title);
  });

  it("exposes translated price performance section title from the view model", () => {
    const { result } = renderHook(() => usePricePerformanceViewModel(), hookOptions());

    expect(result.current.sectionTitle).toBeTruthy();
  });
});
