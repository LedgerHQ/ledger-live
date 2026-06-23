import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { useNavigate } from "react-router";
import { getFiatCurrencyByTicker } from "@ledgerhq/live-common/currencies/index";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import * as usePortfolioBalanceDisplayStateModule from "LLD/hooks/usePortfolioBalanceDisplayState";
import { usePortfolio } from "~/renderer/actions/portfolio";
import { mockPortfolioBalanceInfo, defaultPortfolio } from "LLD/hooks/__tests__/fixtures";
import useAnalyticsViewModel from "../useAnalyticsViewModel";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
}));

jest.mock("LLD/hooks/usePortfolioBalanceDisplayState");
jest.mock("~/renderer/actions/portfolio");

const mockedUseNavigate = jest.mocked(useNavigate);
const mockUsePortfolioBalanceDisplayState = jest.mocked(
  usePortfolioBalanceDisplayStateModule.usePortfolioBalanceDisplayState,
);
const mockUsePortfolio = jest.mocked(usePortfolio);

describe("useAnalyticsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePortfolioBalanceDisplayState.mockReturnValue({
      balanceInfo: mockPortfolioBalanceInfo,
    } as ReturnType<typeof usePortfolioBalanceDisplayStateModule.usePortfolioBalanceDisplayState>);
    mockUsePortfolio.mockReturnValue({
      ...defaultPortfolio,
      countervalueChange: { percentage: 0.2, value: 200 },
    });
  });

  it("should return expected values and navigate back to dashboard", () => {
    const navigate = jest.fn();
    mockedUseNavigate.mockReturnValue(navigate);

    const { result } = renderHook(() => useAnalyticsViewModel(), {
      initialState: {
        ...withFlagOverrides({
          lwdWallet40: { enabled: true, params: { graphRework: true, pnl: true } },
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
    expect(result.current.shouldDisplayGraphRework).toBe(true);
    expect(result.current.shouldDisplayPnl).toBe(false);
    expect(result.current.balanceInfo.valueChange).toEqual({ percentage: 0.2, value: 200 });
    expect(mockUsePortfolioBalanceDisplayState).toHaveBeenCalledWith();

    act(() => {
      result.current.navigateToDashboard();
    });

    expect(navigate).toHaveBeenCalledWith("/");
  });

  it("should derive value change from the selected portfolio range", () => {
    mockedUseNavigate.mockReturnValue(jest.fn());
    mockUsePortfolio.mockReturnValue({
      ...defaultPortfolio,
      countervalueChange: { percentage: 0.08, value: 80 },
    });

    const { result } = renderHook(() => useAnalyticsViewModel(), {
      initialState: {
        ...withFlagOverrides({ lwdWallet40: { enabled: true, params: { graphRework: true } } }),
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
