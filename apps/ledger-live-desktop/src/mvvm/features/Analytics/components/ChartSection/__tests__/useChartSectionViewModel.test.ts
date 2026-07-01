import { act, renderHook } from "tests/testSetup";
import { track } from "~/renderer/analytics/segment";
import { mockPortfolioBalanceInfo } from "LLD/hooks/__tests__/fixtures";
import { useChartSectionViewModel } from "../useChartSectionViewModel";
import { chartSectionInitialState, portfolioWithHistory } from "./fixtures";

jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
}));

const mockTrack = jest.mocked(track);

describe("useChartSectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds chart series from portfolio balance history and maps the selected range", () => {
    const { result } = renderHook(
      () =>
        useChartSectionViewModel({
          balanceInfo: mockPortfolioBalanceInfo,
          portfolio: portfolioWithHistory,
          isLoading: false,
        }),
      { initialState: chartSectionInitialState },
    );

    expect(result.current.chart.series[0].data).toEqual([1000, 1200]);
    expect(result.current.chart.selectedRange).toBe("1w");
    expect(result.current.balanceInfo).toBe(mockPortfolioBalanceInfo);
    expect(result.current.hoveredBalance).toBeNull();
  });

  it("uses balanceInfo availability for the chart loading state", () => {
    const { result } = renderHook(
      () =>
        useChartSectionViewModel({
          balanceInfo: { ...mockPortfolioBalanceInfo, isAvailable: false },
          portfolio: portfolioWithHistory,
          isLoading: true,
        }),
      { initialState: chartSectionInitialState },
    );

    expect(result.current.chart.isLoading).toBe(true);
  });

  it("dispatches the portfolio range and tracks when the chart range changes", () => {
    const { result, store } = renderHook(
      () =>
        useChartSectionViewModel({
          balanceInfo: mockPortfolioBalanceInfo,
          portfolio: portfolioWithHistory,
          isLoading: false,
        }),
      { initialState: chartSectionInitialState },
    );

    act(() => {
      result.current.chart.onRangeChange("1m");
    });

    expect(store.getState().settings.selectedTimeRange).toBe("month");
    expect(mockTrack).toHaveBeenCalledWith("timeframe_clicked", { timeframe: "month" });
  });

  it("masks the chart tooltip value when discreet mode is enabled", () => {
    const { result } = renderHook(
      () =>
        useChartSectionViewModel({
          balanceInfo: mockPortfolioBalanceInfo,
          portfolio: portfolioWithHistory,
          isLoading: false,
        }),
      {
        initialState: {
          settings: { ...chartSectionInitialState.settings, discreetMode: true },
        },
      },
    );

    expect(result.current.chart.formatValue?.(1000)).toBe("$***");
  });

  it("updates hoveredBalance when scrubbing the chart", () => {
    const { result } = renderHook(
      () =>
        useChartSectionViewModel({
          balanceInfo: mockPortfolioBalanceInfo,
          portfolio: portfolioWithHistory,
          isLoading: false,
        }),
      { initialState: chartSectionInitialState },
    );

    act(() => {
      result.current.chart.onScrubberPositionChange?.(0);
    });
    expect(result.current.hoveredBalance).toBe(1000);

    act(() => {
      result.current.chart.onScrubberPositionChange?.(undefined);
    });
    expect(result.current.hoveredBalance).toBeNull();
  });
});
