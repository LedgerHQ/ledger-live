import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { useNavigate } from "react-router";
import { getFiatCurrencyByTicker } from "@ledgerhq/live-common/currencies/index";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import * as usePortfolioBalanceModule from "LLD/hooks/usePortfolioBalance";
import { makePortfolioBalanceReturn } from "LLD/hooks/__tests__/fixtures";
import useAnalyticsViewModel from "../useAnalyticsViewModel";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
}));

jest.mock("LLD/hooks/usePortfolioBalance");

const mockedUseNavigate = jest.mocked(useNavigate);
const mockUsePortfolioBalance = jest.mocked(usePortfolioBalanceModule.usePortfolioBalance);

describe("useAnalyticsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePortfolioBalance.mockReturnValue(makePortfolioBalanceReturn());
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
    expect(result.current.portfolio).toBeDefined();

    act(() => {
      result.current.navigateToDashboard();
    });

    expect(navigate).toHaveBeenCalledWith("/");
  });

  it("should request the portfolio with the user-selected range so it stays consistent with the Portfolio page", () => {
    mockedUseNavigate.mockReturnValue(jest.fn());

    renderHook(() => useAnalyticsViewModel(), {
      initialState: {
        settings: {
          ...INITIAL_STATE,
          counterValue: "USD",
          selectedTimeRange: "month",
        },
      },
    });

    expect(mockUsePortfolioBalance).toHaveBeenCalledWith({ legacyRange: true });
  });
});
