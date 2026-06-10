import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { useNavigate } from "react-router";
import { getFiatCurrencyByTicker } from "@ledgerhq/live-common/currencies/index";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import * as usePortfolioBalanceDisplayStateModule from "LLD/hooks/usePortfolioBalanceDisplayState";
import { mockPortfolioBalanceInfo } from "LLD/hooks/__tests__/fixtures";
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
    } as ReturnType<typeof usePortfolioBalanceDisplayStateModule.usePortfolioBalanceDisplayState>);
  });

  it("should return expected values and navigate back to dashboard", () => {
    const navigate = jest.fn();
    mockedUseNavigate.mockReturnValue(navigate);

    const { result } = renderHook(() => useAnalyticsViewModel(), {
      initialState: {
        ...withFlagOverrides({ lwdWallet40: { enabled: true, params: { graphRework: true } } }),
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
    expect(result.current.balanceInfo).toEqual(mockPortfolioBalanceInfo);
    expect(mockUsePortfolioBalanceDisplayState).toHaveBeenCalledWith({ legacyRange: false });

    act(() => {
      result.current.navigateToDashboard();
    });

    expect(navigate).toHaveBeenCalledWith("/");
  });

  it("should use legacyRange for non-day time ranges", () => {
    mockedUseNavigate.mockReturnValue(jest.fn());

    renderHook(() => useAnalyticsViewModel(), {
      initialState: {
        ...withFlagOverrides({ lwdWallet40: { enabled: true, params: { graphRework: true } } }),
        settings: {
          ...INITIAL_STATE,
          counterValue: "USD",
          selectedTimeRange: "week",
        },
      },
    });

    expect(mockUsePortfolioBalanceDisplayState).toHaveBeenCalledWith({ legacyRange: true });
  });
});
