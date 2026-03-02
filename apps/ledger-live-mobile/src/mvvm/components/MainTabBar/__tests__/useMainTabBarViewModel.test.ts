import { renderHook, act } from "@tests/test-renderer";
import { NavigatorName } from "~/const";
import { scrollToTopEvent } from "../scrollToTopEvent";
import { useMainTabBarViewModel } from "../useMainTabBarViewModel";
import { track } from "~/analytics";

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
