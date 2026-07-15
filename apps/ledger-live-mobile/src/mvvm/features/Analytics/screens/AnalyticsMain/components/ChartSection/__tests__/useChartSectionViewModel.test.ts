import { act, renderHook } from "@tests/test-renderer";
import { track } from "~/analytics";
import { usePortfolioAllAccounts } from "~/hooks/portfolio";
import { useChartSectionViewModel } from "../useChartSectionViewModel";
import { chartSectionInitialState, portfolioWithHistory } from "./fixtures";

jest.mock("~/hooks/portfolio", () => ({
  usePortfolioAllAccounts: jest.fn(),
}));

jest.mock("~/analytics", () => ({
  track: jest.fn(),
}));

const mockUsePortfolioAllAccounts = jest.mocked(usePortfolioAllAccounts);
const mockTrack = jest.mocked(track);

describe("useChartSectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePortfolioAllAccounts.mockReturnValue(portfolioWithHistory);
  });

  it("builds chart series from portfolio balance history and maps the selected range", () => {
    const { result } = renderHook(() => useChartSectionViewModel(), {
      overrideInitialState: chartSectionInitialState,
    });

    expect(result.current.chart.series[0].data).toEqual([1000, 1200]);
    expect(result.current.chart.selectedRange).toBe("1w");
    expect(result.current.header.hoveredBalance).toBeNull();
    expect(result.current.header.scrubDateLabel).toBeUndefined();
    expect(result.current.header.isBalanceAvailable).toBe(true);
    expect(result.current.chart.showScrubberTooltip).toBe(false);
  });

  it("uses balance availability for the chart loading state", () => {
    const { result } = renderHook(() => useChartSectionViewModel(), {
      overrideInitialState: state => ({
        ...chartSectionInitialState(state),
        portfolioBalanceDisplay: {
          ...state.portfolioBalanceDisplay,
          isBalanceAvailable: false,
          isLoading: true,
        },
      }),
    });

    expect(result.current.chart.isLoading).toBe(true);
  });

  it("dispatches the portfolio range and tracks when the chart range changes", () => {
    const { result, store } = renderHook(() => useChartSectionViewModel(), {
      overrideInitialState: chartSectionInitialState,
    });

    act(() => {
      result.current.chart.onRangeChange("1m");
    });

    expect(store.getState().settings.selectedTimeRange).toBe("month");
    expect(mockTrack).toHaveBeenCalledWith("timeframe_clicked", { timeframe: "month" });
  });

  it("formats chart tooltip and variation values from smallest-unit countervalues", () => {
    const { result } = renderHook(() => useChartSectionViewModel(), {
      overrideInitialState: chartSectionInitialState,
    });

    expect(result.current.chart.formatValue?.(1000)).toBe("$10.00");
    expect(result.current.header.variationText).toBe("+$2.00");
    expect(result.current.header.percentageValue).toBe(20);
  });

  it("uses NaN percentage when the value change percentage is unavailable", () => {
    mockUsePortfolioAllAccounts.mockReturnValue({
      ...portfolioWithHistory,
      countervalueChange: { percentage: null, value: 0 },
    });

    const { result } = renderHook(() => useChartSectionViewModel(), {
      overrideInitialState: state => ({
        ...chartSectionInitialState(state),
        settings: {
          ...chartSectionInitialState(state).settings,
          selectedTimeRange: "all",
        },
      }),
    });

    expect(result.current.header.percentageValue).toBeNaN();
  });

  it("masks the chart tooltip value when discreet mode is enabled", () => {
    const { result } = renderHook(() => useChartSectionViewModel(), {
      overrideInitialState: state => ({
        ...chartSectionInitialState(state),
        settings: {
          ...chartSectionInitialState(state).settings,
          discreetMode: true,
        },
      }),
    });

    expect(result.current.chart.formatValue?.(1000)).toBe("$***");
    expect(result.current.header.discreet).toBe(true);
    expect(result.current.header.variationText).toBe("***");
  });

  it("updates hovered balance, scrub date, and range variation when scrubbing the chart", () => {
    const { result } = renderHook(() => useChartSectionViewModel(), {
      overrideInitialState: chartSectionInitialState,
    });

    expect(result.current.header.variationText).toBe("+$2.00");
    expect(result.current.header.percentageValue).toBe(20);

    act(() => {
      result.current.chart.onScrubberPositionChange?.(0);
    });
    expect(result.current.header.hoveredBalance).toBe(1000);
    expect(result.current.header.scrubDateLabel).toBeDefined();
    expect(result.current.header.percentageValue).toBe(0);
    expect(result.current.header.variationText).toBe("$0.00");

    act(() => {
      result.current.chart.onScrubberPositionChange?.(undefined);
    });
    expect(result.current.header.hoveredBalance).toBeNull();
    expect(result.current.header.scrubDateLabel).toBeUndefined();
    expect(result.current.header.percentageValue).toBe(20);
    expect(result.current.header.variationText).toBe("+$2.00");
  });

  it("keeps chart props stable while scrubbing so the chart is not re-rendered", () => {
    const { result } = renderHook(() => useChartSectionViewModel(), {
      overrideInitialState: chartSectionInitialState,
    });

    const chartBeforeScrub = result.current.chart;

    act(() => {
      result.current.chart.onScrubberPositionChange?.(0);
    });

    expect(result.current.chart).toBe(chartBeforeScrub);
  });
});
