import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { useLocation } from "react-router";
import { useSwapAvailability } from "LLD/components/RightPanel/Swap/useSwapAvailability";
import { SCROLL_TO_TOP_EVENT } from "../constants";
import { usePageViewModel } from "../usePageViewModel";

jest.mock("LLD/components/RightPanel/Swap/useSwapAvailability", () => ({
  useSwapAvailability: jest.fn(() => true),
}));

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useLocation: jest.fn(),
}));

const mockedUseLocation = jest.mocked(useLocation);
const mockedUseSwapAvailability = jest.mocked(useSwapAvailability);
const createLocation = (pathname: string) => ({
  pathname,
  search: "",
  hash: "",
  state: null,
  key: "test-location",
});

const wallet40WithRightPanelFlags = {
  lwdWallet40: { enabled: true },
  ptxSwapLiveAppOnPortfolio: { enabled: true },
};

describe("usePageViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSwapAvailability.mockImplementation(
      pathname => pathname === "/analytics" || pathname.startsWith("/asset/"),
    );
  });

  it("computes shouldRenderRightPanel based on current pathname and feature flags", () => {
    mockedUseLocation.mockReturnValue(createLocation("/analytics"));
    const { result, rerender } = renderHook(() => usePageViewModel(), {
      initialState: withFlagOverrides(wallet40WithRightPanelFlags),
    });

    expect(result.current.shouldRenderRightPanel).toBe(true);
    expect(result.current.rightPanelVariant).toBe("swap");

    mockedUseLocation.mockReturnValue(createLocation("/market"));
    rerender();

    expect(result.current.shouldRenderRightPanel).toBe(false);
    expect(result.current.rightPanelVariant).toBeUndefined();
  });

  it("shows the card right panel on /paytab when lwdPayTab is enabled, regardless of swap flags", () => {
    mockedUseLocation.mockReturnValue(createLocation("/paytab"));
    const { result } = renderHook(() => usePageViewModel(), {
      initialState: withFlagOverrides({
        lwdWallet40: { enabled: true },
        ptxSwapLiveAppOnPortfolio: { enabled: false },
        lwdPayTab: { enabled: true },
      }),
    });

    expect(result.current.shouldRenderRightPanel).toBe(true);
    expect(result.current.rightPanelVariant).toBe("card");
  });

  it("hides the card right panel on /paytab when lwdPayTab is disabled", () => {
    mockedUseLocation.mockReturnValue(createLocation("/paytab"));
    const { result } = renderHook(() => usePageViewModel(), {
      initialState: withFlagOverrides({
        lwdWallet40: { enabled: true },
        lwdPayTab: { enabled: false },
      }),
    });

    expect(result.current.shouldRenderRightPanel).toBe(false);
    expect(result.current.rightPanelVariant).toBeUndefined();
  });

  it("shows the right panel on aggregated asset detail routes when swap and aggregated assets are enabled", () => {
    mockedUseLocation.mockReturnValue(createLocation("/asset/bitcoin"));
    const { result } = renderHook(() => usePageViewModel(), {
      initialState: withFlagOverrides({
        lwdWallet40: { enabled: true, params: { aggregatedAssets: true } },
        ptxSwapLiveAppOnPortfolio: { enabled: true },
      }),
    });

    expect(result.current.shouldRenderRightPanel).toBe(true);
  });

  it("hides the right panel on /asset routes when aggregated assets is disabled", () => {
    mockedUseLocation.mockReturnValue(createLocation("/asset/bitcoin"));
    const { result } = renderHook(() => usePageViewModel(), {
      initialState: withFlagOverrides({
        lwdWallet40: {
          enabled: true,
          params: { aggregatedAssets: false },
        },
        ptxSwapLiveAppOnPortfolio: { enabled: true },
      }),
    });

    expect(result.current.shouldRenderRightPanel).toBe(false);
  });

  it("scrolls to top with smooth behavior when SCROLL_TO_TOP_EVENT is dispatched", () => {
    mockedUseLocation.mockReturnValue(createLocation("/"));
    const { result } = renderHook(() => usePageViewModel(), {
      initialState: withFlagOverrides(wallet40WithRightPanelFlags),
    });

    const scroller = document.createElement("div");
    scroller.scrollTo = jest.fn();

    act(() => {
      result.current.pageScrollerRef(scroller);
    });

    act(() => {
      window.dispatchEvent(new CustomEvent(SCROLL_TO_TOP_EVENT));
    });

    expect(scroller.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
  });
});
