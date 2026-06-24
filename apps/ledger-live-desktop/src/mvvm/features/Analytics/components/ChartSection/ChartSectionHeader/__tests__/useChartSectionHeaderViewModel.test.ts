import { renderHook, withFlagOverrides } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { mockCounterValue, mockPortfolioBalanceInfo } from "LLD/hooks/__tests__/fixtures";
import { useChartSectionHeaderViewModel } from "../useChartSectionHeaderViewModel";

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

describe("useChartSectionHeaderViewModel", () => {
  it("formats balance, trend, and range label for the selected portfolio range", () => {
    const { result } = renderHook(
      () =>
        useChartSectionHeaderViewModel({
          balanceInfo: {
            ...mockPortfolioBalanceInfo,
            valueChange: { percentage: 0.1234, value: 567 },
          },
          hoveredBalance: null,
          isLoading: false,
          shouldDisplayBalanceRefreshRework: true,
        }),
      { initialState },
    );

    expect(result.current.balance).toBe(mockPortfolioBalanceInfo.totalBalance);
    expect(result.current.rangeLabel).toBe("1 week");
    expect(result.current.percentageText).toBe("+12.34%");
    expect(result.current.variationVariant).toBe("positive");
  });

  it("uses the hovered balance when scrubbing the chart", () => {
    const { result } = renderHook(
      () =>
        useChartSectionHeaderViewModel({
          balanceInfo: mockPortfolioBalanceInfo,
          hoveredBalance: 1000,
          isLoading: false,
          shouldDisplayBalanceRefreshRework: true,
        }),
      { initialState },
    );

    expect(result.current.balance).toBe(1000);
  });

  it("exposes the loading state passed from the parent view model", () => {
    const { result } = renderHook(
      () =>
        useChartSectionHeaderViewModel({
          balanceInfo: mockPortfolioBalanceInfo,
          hoveredBalance: null,
          isLoading: true,
          shouldDisplayBalanceRefreshRework: true,
        }),
      { initialState },
    );

    expect(result.current.isLoading).toBe(true);
  });
});
