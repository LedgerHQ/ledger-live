import { renderHook } from "tests/testSetup";
import { mockPortfolioBalanceInfo } from "LLD/hooks/__tests__/fixtures";
import { useChartSectionHeaderViewModel } from "../useChartSectionHeaderViewModel";
import { chartSectionHeaderInitialState } from "../../__tests__/fixtures";

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
        }),
      { initialState: chartSectionHeaderInitialState },
    );

    expect(result.current.balance).toBe(mockPortfolioBalanceInfo.totalBalance);
    expect(result.current.rangeLabel).toBe("1 week");
    expect(result.current.percentageValue).toBe(12.34);
  });

  it("formats the variation from a smallest-atom countervalue without a x100 shift", () => {
    const { result } = renderHook(
      () =>
        useChartSectionHeaderViewModel({
          balanceInfo: {
            ...mockPortfolioBalanceInfo,
            valueChange: { percentage: 0.1, value: 1300 },
          },
          hoveredBalance: null,
          isLoading: false,
        }),
      { initialState: chartSectionHeaderInitialState },
    );

    expect(result.current.variationText).toBe("+$13.00");
  });

  it("uses the hovered balance when scrubbing the chart", () => {
    const { result } = renderHook(
      () =>
        useChartSectionHeaderViewModel({
          balanceInfo: mockPortfolioBalanceInfo,
          hoveredBalance: 1000,
          isLoading: false,
        }),
      { initialState: chartSectionHeaderInitialState },
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
        }),
      { initialState: chartSectionHeaderInitialState },
    );

    expect(result.current.isLoading).toBe(true);
  });
});
