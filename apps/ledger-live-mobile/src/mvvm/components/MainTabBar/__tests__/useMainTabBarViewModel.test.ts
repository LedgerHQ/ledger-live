import { renderHook, act } from "@tests/test-renderer";
import { NavigatorName } from "~/const";
import * as stakeLabelHelpers from "~/helpers/getStakeLabelLocaleBased";
import { scrollToTopEvent } from "../scrollToTopEvent";
import { useMainTabBarViewModel } from "../useMainTabBarViewModel";
import { track } from "~/analytics";

jest.mock("~/helpers/getStakeLabelLocaleBased", () => ({
  ...jest.requireActual("~/helpers/getStakeLabelLocaleBased"),
  getEarnOrYieldSuffix: jest.fn(() => "earn" as const),
}));

const mockGetEarnOrYieldSuffix = jest.mocked(stakeLabelHelpers.getEarnOrYieldSuffix);

const TAB_ROUTE_NAMES = [
  NavigatorName.Portfolio,
  NavigatorName.Swap,
  NavigatorName.Earn,
  NavigatorName.CardTab,
];

function createState(activeIndex: number) {
  const routes = TAB_ROUTE_NAMES.map((name, i) => ({ name, key: `tab-${i}` }));
  return { routes, index: activeIndex };
}

function createNavigation() {
  return {
    emit: () => ({ defaultPrevented: false }),
    navigate: jest.fn(),
  };
}

describe("useMainTabBarViewModel", () => {
  afterEach(() => {
    mockGetEarnOrYieldSuffix.mockReset().mockReturnValue("earn");
  });

  describe("earn/yield label based on locale", () => {
    it("should use 'Earn' label for non-GB users", () => {
      mockGetEarnOrYieldSuffix.mockReturnValue("earn");

      const state = createState(0);
      const navigation = createNavigation();
      const { result } = renderHook(() =>
        useMainTabBarViewModel({ state: state as never, navigation: navigation as never }),
      );

      const earnTab = result.current.tabItems.find(item => item.value === NavigatorName.Earn);
      expect(earnTab?.label).toBe("Earn");
    });

    it("should use 'Yield' label for GB users", () => {
      mockGetEarnOrYieldSuffix.mockReturnValue("yield");

      const state = createState(0);
      const navigation = createNavigation();
      const { result } = renderHook(() =>
        useMainTabBarViewModel({ state: state as never, navigation: navigation as never }),
      );

      const earnTab = result.current.tabItems.find(item => item.value === NavigatorName.Earn);
      expect(earnTab?.label).toBe("Yield");
    });
  });

  describe("scroll to top", () => {
    it("should emit scroll-to-top when re-pressing Home tab while already on Home", () => {
      const onScrollToTop = jest.fn();
      const unsubscribe = scrollToTopEvent.subscribe(onScrollToTop);

      const state = createState(0);
      const navigation = createNavigation();
      const { result } = renderHook(() =>
        useMainTabBarViewModel({ state: state as never, navigation: navigation as never }),
      );

      act(() => {
        result.current.onTabPress(NavigatorName.Portfolio);
      });

      expect(onScrollToTop).toHaveBeenCalledTimes(1);
      expect(track).not.toHaveBeenCalled();
      unsubscribe();
    });

    it("should not emit scroll-to-top when pressing Home tab while on another tab", () => {
      const onScrollToTop = jest.fn();
      const unsubscribe = scrollToTopEvent.subscribe(onScrollToTop);

      const state = createState(1);
      const navigation = createNavigation();
      const { result } = renderHook(() =>
        useMainTabBarViewModel({ state: state as never, navigation: navigation as never }),
      );

      act(() => {
        result.current.onTabPress(NavigatorName.Portfolio);
      });

      expect(onScrollToTop).not.toHaveBeenCalled();
      expect(track).toHaveBeenCalled();
      unsubscribe();
    });

    it("should not emit scroll-to-top when pressing a different tab while on Home", () => {
      const onScrollToTop = jest.fn();
      const unsubscribe = scrollToTopEvent.subscribe(onScrollToTop);

      const state = createState(0);
      const navigation = createNavigation();
      const { result } = renderHook(() =>
        useMainTabBarViewModel({ state: state as never, navigation: navigation as never }),
      );

      act(() => {
        result.current.onTabPress(NavigatorName.Swap);
      });

      expect(onScrollToTop).not.toHaveBeenCalled();
      expect(track).toHaveBeenCalled();
      unsubscribe();
    });
  });
});
