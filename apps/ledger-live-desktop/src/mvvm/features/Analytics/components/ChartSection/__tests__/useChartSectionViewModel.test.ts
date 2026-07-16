import { act, renderHook } from "tests/testSetup";
import { track } from "~/renderer/analytics/segment";
import { mockPortfolioBalanceInfo } from "LLD/hooks/__tests__/fixtures";
import { useChartSectionViewModel } from "../useChartSectionViewModel";
import { chartSectionInitialState, portfolioWithHistory } from "./fixtures";

jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
}));

const mockTrack = jest.mocked(track);

const renderChartSectionViewModel = () =>
  renderHook(
    () =>
      useChartSectionViewModel({
        balanceInfo: mockPortfolioBalanceInfo,
        portfolio: portfolioWithHistory,
        isLoading: false,
      }),
    { initialState: chartSectionInitialState },
  );

describe("useChartSectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds chart series from portfolio balance history and maps the selected range", () => {
    const { result } = renderChartSectionViewModel();

    expect(result.current.chart.series[0].data).toEqual([1000, 1200]);
    expect(result.current.chart.selectedRange).toBe("1w");
    expect(result.current.header.balanceInfo).toBe(mockPortfolioBalanceInfo);
    expect(result.current.header.scrubSelection).toBeUndefined();
    expect(result.current.chart.showScrubberTooltip).toBe(false);
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
    const { result, store } = renderChartSectionViewModel();

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

  it("updates scrub selection when scrubbing the chart", () => {
    const { result } = renderChartSectionViewModel();

    act(() => {
      result.current.chart.onScrubberPositionChange?.(0);
    });
    expect(result.current.header.scrubSelection).toEqual({
      balance: 1000,
      timestamp: portfolioWithHistory.balanceHistory[0].date.getTime(),
    });

    act(() => {
      result.current.chart.onScrubberPositionChange?.(undefined);
    });
    expect(result.current.header.scrubSelection).toBeUndefined();
  });

  it("keeps chart props stable while scrubbing so the chart is not re-rendered", () => {
    const { result } = renderChartSectionViewModel();

    const chartBeforeScrub = result.current.chart;

    act(() => {
      result.current.chart.onScrubberPositionChange?.(0);
    });

    expect(result.current.chart).toBe(chartBeforeScrub);
  });
});
