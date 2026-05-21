import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { useLocation } from "react-router";
import { SCROLL_TO_TOP_EVENT } from "../constants";
import { usePageViewModel } from "../usePageViewModel";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useLocation: jest.fn(),
}));

const mockedUseLocation = jest.mocked(useLocation);
const createLocation = (pathname: string) => ({
  pathname,
  search: "",
  hash: "",
  state: null,
  key: "test-location",
});

const wallet40WithRightPanelFlags = {
  lwdWallet40: { enabled: true, params: { mainNavigation: true } },
  ptxSwapLiveAppOnPortfolio: { enabled: true },
};

describe("usePageViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("computes shouldRenderRightPanel based on current pathname and feature flags", () => {
    mockedUseLocation.mockReturnValue(createLocation("/analytics"));
    const { result, rerender } = renderHook(() => usePageViewModel(), {
      initialState: withFlagOverrides(wallet40WithRightPanelFlags),
    });

    expect(result.current.shouldRenderRightPanel).toBe(true);

    mockedUseLocation.mockReturnValue(createLocation("/market"));
    rerender();

    expect(result.current.shouldRenderRightPanel).toBe(false);
  });

  it("shows the right panel on aggregated asset detail routes when swap and aggregated assets are enabled", () => {
    mockedUseLocation.mockReturnValue(createLocation("/asset/bitcoin"));
    const { result } = renderHook(() => usePageViewModel(), {
      initialState: withFlagOverrides({
        lwdWallet40: { enabled: true, params: { mainNavigation: true, aggregatedAssets: true } },
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
          params: { mainNavigation: true, aggregatedAssets: false },
        },
        ptxSwapLiveAppOnPortfolio: { enabled: true },
      }),
    });

    expect(result.current.shouldRenderRightPanel).toBe(false);
  });

  it("tracks scroll state and scrolls to top on user action", () => {
    mockedUseLocation.mockReturnValue(createLocation("/"));
    const { result } = renderHook(() => usePageViewModel(), {
      initialState: withFlagOverrides(wallet40WithRightPanelFlags),
    });

    let listener: ((event: Event) => void) | undefined;
    const scroller = document.createElement("div");
    Object.defineProperty(scroller, "scrollTop", { value: 0, writable: true });
    scroller.scrollTo = jest.fn();
    const addEventListenerSpy = jest
      .spyOn(scroller, "addEventListener")
      .mockImplementation((event, callback) => {
        if (event === "scroll" && typeof callback === "function") {
          listener = callback;
        }
      });

    act(() => {
      result.current.pageScrollerRef(scroller);
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function), {
      passive: true,
    });
    expect(result.current.isScrollAtUpperBound).toBe(true);
    expect(result.current.isScrollUpButtonVisible).toBe(false);

    act(() => {
      scroller.scrollTop = 900;
      listener?.(new Event("scroll"));
    });

    expect(result.current.isScrollAtUpperBound).toBe(false);
    expect(result.current.isScrollUpButtonVisible).toBe(true);

    act(() => {
      result.current.onClickScrollUp();
    });

    expect(scroller.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
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
