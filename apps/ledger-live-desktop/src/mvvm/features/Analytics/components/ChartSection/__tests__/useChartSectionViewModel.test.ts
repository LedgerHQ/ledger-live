import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { usePortfolio } from "~/renderer/actions/portfolio";
import { track } from "~/renderer/analytics/segment";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import * as usePortfolioBalanceDisplayStateModule from "LLD/hooks/usePortfolioBalanceDisplayState";
import {
  defaultPortfolio,
  mockCounterValue,
  mockPortfolioBalanceInfo,
} from "LLD/hooks/__tests__/fixtures";
import { useChartSectionViewModel } from "../useChartSectionViewModel";

jest.mock("~/renderer/actions/portfolio");
jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
}));
jest.mock("LLD/hooks/usePortfolioBalanceDisplayState");

const mockUsePortfolio = jest.mocked(usePortfolio);
const mockTrack = jest.mocked(track);
const mockUsePortfolioBalanceDisplayState = jest.mocked(
  usePortfolioBalanceDisplayStateModule.usePortfolioBalanceDisplayState,
);

const portfolioWithHistory = {
  ...defaultPortfolio,
  balanceHistory: [
    { date: new Date("2026-01-01T00:00:00.000Z"), value: 1000 },
    { date: new Date("2026-01-02T00:00:00.000Z"), value: 1200 },
  ],
  countervalueChange: { percentage: 0.2, value: 200 },
};

const initialState = {
  settings: {
    ...INITIAL_STATE,
    counterValue: "USD",
    counterValueCurrency: mockCounterValue,
    selectedTimeRange: "week" as const,
  },
  ...withFlagOverrides({
    lwdWallet40: { enabled: true, params: { balanceRefreshRework: true } },
  }),
};

describe("useChartSectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePortfolio.mockReturnValue(portfolioWithHistory);
    mockUsePortfolioBalanceDisplayState.mockReturnValue({
      isLoading: false,
      shouldDisplayBalanceRefreshRework: true,
    } as ReturnType<typeof usePortfolioBalanceDisplayStateModule.usePortfolioBalanceDisplayState>);
  });

  it("builds chart series from portfolio balance history and maps the selected range", () => {
    const { result } = renderHook(
      () => useChartSectionViewModel({ balanceInfo: mockPortfolioBalanceInfo }),
      { initialState },
    );

    expect(result.current.series[0].data).toEqual([1000, 1200]);
    expect(result.current.selectedRange).toBe("1w");
    expect(result.current.rangeLabel).toBe("1W");
    expect(result.current.balance).toBe(mockPortfolioBalanceInfo.totalBalance);
  });

  it("dispatches the portfolio range and tracks when the chart range changes", () => {
    const { result, store } = renderHook(
      () => useChartSectionViewModel({ balanceInfo: mockPortfolioBalanceInfo }),
      { initialState },
    );

    act(() => {
      result.current.onRangeChange("1m");
    });

    expect(store.getState().settings.selectedTimeRange).toBe("month");
    expect(mockTrack).toHaveBeenCalledWith("timeframe_clicked", { timeframe: "month" });
  });

  it("updates the displayed balance when scrubbing the chart", () => {
    const { result } = renderHook(
      () => useChartSectionViewModel({ balanceInfo: mockPortfolioBalanceInfo }),
      { initialState },
    );

    act(() => {
      result.current.onScrubberPositionChange(0);
    });
    expect(result.current.balance).toBe(1000);

    act(() => {
      result.current.onScrubberPositionChange(undefined);
    });
    expect(result.current.balance).toBe(mockPortfolioBalanceInfo.totalBalance);
  });

  it("passes valueChange from balanceInfo to the view", () => {
    const valueChange = { percentage: 0.0523, value: 100 };
    const { result } = renderHook(
      () =>
        useChartSectionViewModel({
          balanceInfo: {
            ...mockPortfolioBalanceInfo,
            valueChange,
          },
        }),
      { initialState },
    );

    expect(result.current.valueChange).toBe(valueChange);
  });

  it("exposes the sync loading state from usePortfolioBalanceDisplayState", () => {
    mockUsePortfolioBalanceDisplayState.mockReturnValue({
      isLoading: true,
      shouldDisplayBalanceRefreshRework: true,
    } as ReturnType<typeof usePortfolioBalanceDisplayStateModule.usePortfolioBalanceDisplayState>);

    const { result } = renderHook(
      () => useChartSectionViewModel({ balanceInfo: mockPortfolioBalanceInfo }),
      { initialState },
    );

    expect(result.current.isLoading).toBe(true);
  });
});
