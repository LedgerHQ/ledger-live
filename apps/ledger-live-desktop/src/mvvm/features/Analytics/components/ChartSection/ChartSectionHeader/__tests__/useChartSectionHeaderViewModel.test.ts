import { renderHook } from "tests/testSetup";
import { mockPortfolioBalanceInfo } from "LLD/hooks/__tests__/fixtures";
import { useChartSectionHeaderViewModel } from "../useChartSectionHeaderViewModel";
import { chartSectionHeaderInitialState, portfolioWithHistory } from "../../__tests__/fixtures";

const chartPrices = portfolioWithHistory.balanceHistory.map(point => point.value);

describe("useChartSectionHeaderViewModel", () => {
  it("formats balance, trend, and range label for the selected portfolio range", () => {
    const { result } = renderHook(
      () =>
        useChartSectionHeaderViewModel({
          balanceInfo: {
            ...mockPortfolioBalanceInfo,
            valueChange: { percentage: 0.1234, value: 567 },
          },
          chartPrices,
          isLoading: false,
        }),
      { initialState: chartSectionHeaderInitialState },
    );

    expect(result.current.balance).toBe(mockPortfolioBalanceInfo.totalBalance);
    expect(result.current.totalBalanceLabel).toBe("Total balance");
    expect(result.current.rangeLabel).toBe("1 week");
    expect(result.current.scrubDateLabel).toBeUndefined();
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
          chartPrices,
          isLoading: false,
        }),
      { initialState: chartSectionHeaderInitialState },
    );

    expect(result.current.variationText).toBe("+$13.00");
  });

  it("uses the scrubbed balance, date, and variation when scrubbing the chart", () => {
    const { result } = renderHook(
      () =>
        useChartSectionHeaderViewModel({
          balanceInfo: mockPortfolioBalanceInfo,
          scrubSelection: {
            balance: 1000,
            timestamp: portfolioWithHistory.balanceHistory[0].date.getTime(),
          },
          chartPrices,
          isLoading: false,
        }),
      { initialState: chartSectionHeaderInitialState },
    );

    expect(result.current.balance).toBe(1000);
    expect(result.current.scrubDateLabel).toBeDefined();
    expect(result.current.scrubDateLabel).not.toBe("1 week");
    expect(result.current.percentageValue).toBe(0);
    expect(result.current.variationText).toBe("$0.00");
    expect(result.current.isLoading).toBe(false);
  });

  it("exposes the loading state passed from the parent view model", () => {
    const { result } = renderHook(
      () =>
        useChartSectionHeaderViewModel({
          balanceInfo: mockPortfolioBalanceInfo,
          chartPrices,
          isLoading: true,
        }),
      { initialState: chartSectionHeaderInitialState },
    );

    expect(result.current.isLoading).toBe(true);
  });
});
