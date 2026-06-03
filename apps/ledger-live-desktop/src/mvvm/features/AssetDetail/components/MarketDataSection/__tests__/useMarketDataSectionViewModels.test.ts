import { act, renderHook } from "tests/testSetup";
import { createMockMarketCurrencyData } from "@ledgerhq/live-common/market/utils/fixtures";
import { track } from "~/renderer/analytics/segment";
import { ASSET_DETAIL_TRACKING_PAGE_NAME } from "LLD/features/AssetDetail/constants";
import type { MarketDataSectionCurrencyData } from "../hooks/useMarketDataSectionCurrencyData";
import { useMarketStatsViewModel } from "../MarketStats/hooks/useMarketStatsViewModel";
import { usePricePerformanceViewModel } from "../PricePerformance/hooks/usePricePerformanceViewModel";

jest.mock("~/renderer/hooks/useDateFormatter", () => ({
  ...jest.requireActual("~/renderer/hooks/useDateFormatter"),
  useDateFormatter: jest.fn(() => () => "Nov 10, 2021"),
  fromNow: jest.fn(() => "2 years ago"),
}));

const buildCurrencyData = (
  overrides: Partial<MarketDataSectionCurrencyData> = {},
): MarketDataSectionCurrencyData => ({
  data: createMockMarketCurrencyData({ marketcapRank: 1 }),
  showSkeleton: false,
  counterCurrency: "usd",
  locale: "en-US",
  ...overrides,
});

const hookOptions = () => ({
  minimal: false as const,
  initialState: { settings: { counterValue: "USD" } },
});

describe("useMarketStatsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a skeleton when currencyData reports loading", () => {
    const { result } = renderHook(
      () => useMarketStatsViewModel(buildCurrencyData({ showSkeleton: true, data: undefined })),
      hookOptions(),
    );

    expect(result.current.showSkeleton).toBe(true);
  });

  it("hides the skeleton once currencyData provides data", () => {
    const { result } = renderHook(
      () => useMarketStatsViewModel(buildCurrencyData()),
      hookOptions(),
    );

    expect(result.current.showSkeleton).toBe(false);
  });

  it("tracks market_stat_definition when a stat tooltip opens", () => {
    const { result } = renderHook(
      () => useMarketStatsViewModel(buildCurrencyData({ ledgerCurrencyId: "bitcoin" })),
      hookOptions(),
    );

    act(() => result.current.onTooltipOpen("circulating_supply", true));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "market_stat_definition",
      currency: "bitcoin",
      type: "circulating_supply",
      page: ASSET_DETAIL_TRACKING_PAGE_NAME,
    });

    jest.mocked(track).mockClear();
    act(() => result.current.onTooltipOpen("circulating_supply", false));
    expect(track).not.toHaveBeenCalled();
  });

  it("formats market rank with a sharp sign when CoinGecko rank is positive", () => {
    const { result } = renderHook(
      () =>
        useMarketStatsViewModel(
          buildCurrencyData({ data: createMockMarketCurrencyData({ marketcapRank: 3 }) }),
        ),
      hookOptions(),
    );
    const rankRow = result.current.rows.find(r => r.key === "market_rank");

    expect(rankRow?.value).toBe("#3");
  });

  it("uses a hyphen for zero marketcap rank to match counter value placeholders", () => {
    const { result } = renderHook(
      () =>
        useMarketStatsViewModel(
          buildCurrencyData({ data: createMockMarketCurrencyData({ marketcapRank: 0 }) }),
        ),
      hookOptions(),
    );

    expect(result.current.rows.find(r => r.key === "market_rank")?.value).toBe("-");
  });

  it("lists fixed stat rows in design order", () => {
    const { result } = renderHook(
      () => useMarketStatsViewModel(buildCurrencyData()),
      hookOptions(),
    );

    expect(result.current.rows.map(r => r.key)).toEqual([
      "market_cap",
      "market_rank",
      "circulating_supply",
      "max_supply",
      "trading_volume_24h",
    ]);
  });

  it("exposes translated section header strings from the view model", () => {
    const { result } = renderHook(
      () => useMarketStatsViewModel(buildCurrencyData()),
      hookOptions(),
    );

    expect(result.current.sectionTitle).toBeTruthy();
    expect(result.current.sectionTooltip).toBeTruthy();
  });

  it("exposes tooltips for stat rows that include an info icon", () => {
    const { result } = renderHook(
      () => useMarketStatsViewModel(buildCurrencyData()),
      hookOptions(),
    );

    expect(result.current.rows.find(r => r.key === "market_cap")?.tooltip).toBeTruthy();
    expect(result.current.rows.find(r => r.key === "market_rank")?.tooltip).toBeUndefined();
    expect(result.current.rows.find(r => r.key === "circulating_supply")?.tooltip).toBeTruthy();
    expect(result.current.rows.find(r => r.key === "max_supply")?.tooltip).toBeTruthy();
    expect(result.current.rows.find(r => r.key === "trading_volume_24h")?.tooltip).toBeTruthy();
  });

  it("appends the asset ticker on supply rows", () => {
    const { result } = renderHook(
      () => useMarketStatsViewModel(buildCurrencyData()),
      hookOptions(),
    );

    expect(result.current.rows.find(r => r.key === "circulating_supply")?.value).toMatch(/BTC$/);
    expect(result.current.rows.find(r => r.key === "max_supply")?.value).toMatch(/BTC$/);
  });

  it("shows the ∞ symbol for max supply when the coin is uncapped but has market data", () => {
    const { result } = renderHook(
      () =>
        useMarketStatsViewModel(
          buildCurrencyData({
            data: createMockMarketCurrencyData({ maxSupply: 0, circulatingSupply: 19_000_000 }),
          }),
        ),
      hookOptions(),
    );

    expect(result.current.rows.find(r => r.key === "max_supply")?.value).toBe("∞");
  });

  it("shows a hyphen for max supply when no supply data is available", () => {
    const { result } = renderHook(
      () =>
        useMarketStatsViewModel(
          buildCurrencyData({
            data: createMockMarketCurrencyData({ maxSupply: 0, circulatingSupply: 0 }),
          }),
        ),
      hookOptions(),
    );

    expect(result.current.rows.find(r => r.key === "max_supply")?.value).toBe("-");
  });
});

describe("usePricePerformanceViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders ATH change vs current price as a percentage", () => {
    const { result } = renderHook(
      () =>
        usePricePerformanceViewModel(
          buildCurrencyData({
            data: createMockMarketCurrencyData({
              price: 50_000,
              ath: 69_000,
              athDate: new Date("2021-11-10T00:00:00.000Z"),
              atl: 67.81,
              atlDate: new Date("2013-07-06T00:00:00.000Z"),
            }),
          }),
        ),
      hookOptions(),
    );

    expect(result.current.athBlock.changeText).not.toBe("-");
    expect(result.current.athBlock.changeText).toMatch(/^-/);
    expect(result.current.athBlock.changeText).toMatch(/%$/);
  });

  it("uses hyphen change text when ATH is zero so the ratio is undefined", () => {
    const { result } = renderHook(
      () =>
        usePricePerformanceViewModel(
          buildCurrencyData({ data: createMockMarketCurrencyData({ price: 50_000, ath: 0 }) }),
        ),
      hookOptions(),
    );

    expect(result.current.athBlock.changeText).toBe("-");
  });

  it("shows a skeleton when currencyData reports loading without cached data", () => {
    const { result } = renderHook(
      () =>
        usePricePerformanceViewModel(buildCurrencyData({ showSkeleton: true, data: undefined })),
      hookOptions(),
    );

    expect(result.current.showSkeleton).toBe(true);
  });

  it("combines mocked long-date and relative parts for ATH line", () => {
    const { result } = renderHook(
      () =>
        usePricePerformanceViewModel(
          buildCurrencyData({
            data: createMockMarketCurrencyData({
              athDate: new Date("2021-11-10T00:00:00.000Z"),
            }),
          }),
        ),
      hookOptions(),
    );

    expect(result.current.athBlock.dateLine).toBe("Nov 10, 2021 (2 years ago)");
  });

  it("falls back title keys for ATH and ATL sections", () => {
    const { result } = renderHook(
      () => usePricePerformanceViewModel(buildCurrencyData()),
      hookOptions(),
    );

    expect(result.current.athBlock.title).toBeTruthy();
    expect(result.current.atlBlock.title).toBeTruthy();
    expect(result.current.athBlock.title).not.toBe(result.current.atlBlock.title);
  });

  it("exposes translated price performance section title from the view model", () => {
    const { result } = renderHook(
      () => usePricePerformanceViewModel(buildCurrencyData()),
      hookOptions(),
    );

    expect(result.current.sectionTitle).toBeTruthy();
  });
});
