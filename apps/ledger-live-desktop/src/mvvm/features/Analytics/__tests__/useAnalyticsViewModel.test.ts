import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { useNavigate } from "react-router";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import * as usePortfolioBalanceDisplayStateModule from "LLD/hooks/usePortfolioBalanceDisplayState";
import { mockPortfolioBalanceInfo, defaultPortfolio } from "LLD/hooks/__tests__/fixtures";
import useAnalyticsViewModel from "../useAnalyticsViewModel";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
}));

jest.mock("LLD/hooks/usePortfolioBalanceDisplayState");

const mockedUseNavigate = jest.mocked(useNavigate);
const mockUsePortfolioBalanceDisplayState = jest.mocked(
  usePortfolioBalanceDisplayStateModule.usePortfolioBalanceDisplayState,
);

describe("useAnalyticsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePortfolioBalanceDisplayState.mockReturnValue({
      balanceInfo: mockPortfolioBalanceInfo,
      portfolio: {
        ...defaultPortfolio,
        countervalueChange: { percentage: 0.2, value: 200 },
      },
      isLoading: false,
    } as ReturnType<typeof usePortfolioBalanceDisplayStateModule.usePortfolioBalanceDisplayState>);
  });

  it("should return expected values and navigate back to dashboard", () => {
    const navigate = jest.fn();
    mockedUseNavigate.mockReturnValue(navigate);

    const { result } = renderHook(() => useAnalyticsViewModel(), {
      initialState: {
        ...withFlagOverrides({
          lwdWallet40: { enabled: true, params: { pnl: true } },
        }),
        settings: {
          ...INITIAL_STATE,
          counterValue: "USD",
          selectedTimeRange: "day",
        },
      },
    });

    expect(result.current.counterValue).toBe(getFiatCurrencyByTicker("USD"));
    expect(result.current.selectedTimeRange).toBe("day");
    expect(result.current.shouldDisplayPnl).toBe(false);
    expect(result.current.balanceInfo.valueChange).toEqual({ percentage: 0.2, value: 200 });
    expect(result.current.portfolio.countervalueChange).toEqual({ percentage: 0.2, value: 200 });
    expect(result.current.isLoading).toBe(false);
    expect(mockUsePortfolioBalanceDisplayState).toHaveBeenCalledWith({ legacyRange: true });

    act(() => {
      result.current.navigateToDashboard();
    });

    expect(navigate).toHaveBeenCalledWith("/");
  });

  it("should derive value change from the selected portfolio range", () => {
    mockedUseNavigate.mockReturnValue(jest.fn());
    mockUsePortfolioBalanceDisplayState.mockReturnValue({
      balanceInfo: mockPortfolioBalanceInfo,
      portfolio: {
        ...defaultPortfolio,
        countervalueChange: { percentage: 0.08, value: 80 },
      },
      isLoading: false,
    } as ReturnType<typeof usePortfolioBalanceDisplayStateModule.usePortfolioBalanceDisplayState>);

    const { result } = renderHook(() => useAnalyticsViewModel(), {
      initialState: {
        ...withFlagOverrides({ lwdWallet40: { enabled: true } }),
        settings: {
          ...INITIAL_STATE,
          counterValue: "USD",
          selectedTimeRange: "week",
        },
      },
    });

    expect(result.current.balanceInfo.valueChange).toEqual({ percentage: 0.08, value: 80 });
  });
});
