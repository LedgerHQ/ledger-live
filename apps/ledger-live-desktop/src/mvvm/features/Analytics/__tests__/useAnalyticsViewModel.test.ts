import { act, renderHook } from "tests/testSetup";
import { useNavigate } from "react-router";
import { getFiatCurrencyByTicker } from "@ledgerhq/live-common/currencies/index";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import useAnalyticsViewModel from "../useAnalyticsViewModel";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
}));

const mockedUseNavigate = jest.mocked(useNavigate);
describe("useAnalyticsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns expected values and navigates back to dashboard", () => {
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
});
