import { renderHook, withFlagOverrides } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import * as usePortfolioBalanceDisplayStateModule from "LLD/hooks/usePortfolioBalanceDisplayState";
import { mockCounterValue, mockPortfolioBalanceInfo } from "LLD/hooks/__tests__/fixtures";
import { useChartSectionHeaderViewModel } from "../useChartSectionHeaderViewModel";

jest.mock("LLD/hooks/usePortfolioBalanceDisplayState");

const mockUsePortfolioBalanceDisplayState = jest.mocked(
  usePortfolioBalanceDisplayStateModule.usePortfolioBalanceDisplayState,
);

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
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePortfolioBalanceDisplayState.mockReturnValue({
      isLoading: false,
      shouldDisplayBalanceRefreshRework: true,
    } as ReturnType<typeof usePortfolioBalanceDisplayStateModule.usePortfolioBalanceDisplayState>);
  });

  it("formats balance, trend, and range label for the selected portfolio range", () => {
    const { result } = renderHook(
      () =>
        useChartSectionHeaderViewModel({
          balanceInfo: {
            ...mockPortfolioBalanceInfo,
            valueChange: { percentage: 0.1234, value: 567 },
          },
          hoveredBalance: null,
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
        }),
      { initialState },
    );

    expect(result.current.balance).toBe(1000);
  });

  it("exposes the sync loading state from usePortfolioBalanceDisplayState", () => {
    mockUsePortfolioBalanceDisplayState.mockReturnValue({
      isLoading: true,
      shouldDisplayBalanceRefreshRework: true,
    } as ReturnType<typeof usePortfolioBalanceDisplayStateModule.usePortfolioBalanceDisplayState>);

    const { result } = renderHook(
      () =>
        useChartSectionHeaderViewModel({
          balanceInfo: mockPortfolioBalanceInfo,
          hoveredBalance: null,
        }),
      { initialState },
    );

    expect(result.current.isLoading).toBe(true);
  });
});
