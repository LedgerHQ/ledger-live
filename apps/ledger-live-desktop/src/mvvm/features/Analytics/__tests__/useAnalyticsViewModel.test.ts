import { act, renderHook } from "tests/testSetup";
import { useNavigate } from "react-router";
import { getFiatCurrencyByTicker } from "@ledgerhq/live-common/currencies/index";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import useAnalyticsViewModel from "../useAnalyticsViewModel";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
}));

const mockUseAllocationData = jest.fn();
jest.mock("../hooks/useAllocationData", () => ({
  useAllocationData: (...args: unknown[]) => mockUseAllocationData(...args),
}));

const mockedUseNavigate = jest.mocked(useNavigate);

const defaultAllocation = { items: [], totalCount: 0 };

describe("useAnalyticsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAllocationData.mockReturnValue(defaultAllocation);
  });

  it("should return expected values and navigate back to dashboard", () => {
    const navigate = jest.fn();
    mockedUseNavigate.mockReturnValue(navigate);

    const { result } = renderHook(() => useAnalyticsViewModel(), {
      initialState: {
        settings: {
          ...INITIAL_STATE,
          counterValue: "USD",
          selectedTimeRange: "day",
          overriddenFeatureFlags: {
            ...INITIAL_STATE.overriddenFeatureFlags,
            lwdWallet40: {
              enabled: true,
              params: { graphRework: true },
            },
          },
        },
      },
    });

    expect(result.current.counterValue).toBe(getFiatCurrencyByTicker("USD"));
    expect(result.current.selectedTimeRange).toBe("day");
    expect(result.current.shouldDisplayGraphRework).toBe(true);

    act(() => {
      result.current.navigateToDashboard();
    });

    expect(navigate).toHaveBeenCalledWith("/");
  });

  it("should expose allocation data from useAllocationData", () => {
    const navigate = jest.fn();
    mockedUseNavigate.mockReturnValue(navigate);

    const mockAllocation = {
      items: [{ currency: { id: "bitcoin" }, balance: 100, value: 50000, distribution: 60 }],
      totalCount: 1,
    };
    mockUseAllocationData.mockReturnValue(mockAllocation);

    const { result } = renderHook(() => useAnalyticsViewModel(), {
      initialState: { settings: { ...INITIAL_STATE } },
    });

    expect(result.current.allocation).toBe(mockAllocation);
  });
});
