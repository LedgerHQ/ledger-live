import { track } from "@shared/analytics";
import { renderHook, act } from "@tests/test-renderer";
import { NavigatorName } from "~/const";
import * as stakeLabelHelpers from "~/helpers/getStakeLabelLocaleBased";
import { scrollToTopEvent } from "../scrollToTopEvent";
import { useMainTabBarViewModel } from "../useMainTabBarViewModel";

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
  NavigatorName.AgentIntentTab,
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

function renderOnTab(activeIndex: number) {
  const state = createState(activeIndex);
  const navigation = createNavigation();
  return renderHook(() =>
    useMainTabBarViewModel({ state: state as never, navigation: navigation as never }),
  );
}

describe("useMainTabBarViewModel", () => {
  afterEach(() => {
    mockGetEarnOrYieldSuffix.mockReset().mockReturnValue("earn");
  });

  describe("earn/yield tab label", () => {
    it.each([
      { suffix: "earn" as const, expectedLabel: "Earn" },
      { suffix: "yield" as const, expectedLabel: "Yield" },
    ])(
      "should use '$expectedLabel' label when getEarnOrYieldSuffix returns '$suffix'",
      ({ suffix, expectedLabel }) => {
        mockGetEarnOrYieldSuffix.mockReturnValue(suffix);

        const state = createState(0);
        const navigation = createNavigation();
        const { result } = renderHook(() =>
          useMainTabBarViewModel({ state: state as never, navigation: navigation as never }),
        );

        const earnTab = result.current.tabItems.find(item => item.value === NavigatorName.Earn);
        expect(earnTab?.label).toBe(expectedLabel);
      },
    );
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

  describe("agent intent tab", () => {
    it("should show the Agents label and test id", () => {
      const { result } = renderOnTab(0);

      const agentsTab = result.current.tabItems.find(
        item => item.value === NavigatorName.AgentIntentTab,
      );
      expect(agentsTab).toMatchObject({ label: "Agents", testID: "w40-tab-agents" });
    });

    it("should track the nav bar source when opening the Agents tab", () => {
      const { result } = renderOnTab(0);

      act(() => {
        result.current.onTabPress(NavigatorName.AgentIntentTab);
      });

      expect(track).toHaveBeenCalledWith("menuentry_clicked", {
        entry: "agent_intent",
        page: "Wallet",
        source: "nav_bar",
      });
    });

    it("should not add a source when opening another tab", () => {
      const { result } = renderOnTab(0);

      act(() => {
        result.current.onTabPress(NavigatorName.Swap);
      });

      expect(track).toHaveBeenCalledWith("menuentry_clicked", { entry: "Swap", page: "Wallet" });
    });
  });
});
