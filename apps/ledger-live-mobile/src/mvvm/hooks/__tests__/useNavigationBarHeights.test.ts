import { renderHook } from "@tests/test-renderer";
import { Platform } from "react-native";
import { useNavigationBarHeights } from "../useNavigationBarHeights";
import { State } from "~/reducers/types";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/reducers/settings";
import { TAB_BAR_HEIGHT } from "~/components/TabBar/shared";

const mockInsets = { top: 44, bottom: 34, left: 0, right: 0 };
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => mockInsets,
}));

const withFeatureFlag = (enabled: boolean) => (state: State) => ({
  ...state,
  settings: {
    ...SETTINGS_INITIAL_STATE,
    overriddenFeatureFlags: {
      lwmWallet40: {
        enabled,
        params: { mainNavigation: true },
      },
    },
  },
});

const withTabBarVisibility = (isVisible: boolean) => (state: State) => ({
  ...withFeatureFlag(true)(state),
  appstate: {
    ...state.appstate,
    isMainNavigatorVisible: isVisible,
  },
});

describe("useNavigationBarHeights", () => {
  describe("when lwmWallet40 feature flag is disabled", () => {
    it("should throw error", () => {
      expect(() => {
        renderHook(() => useNavigationBarHeights(), {
          overrideInitialState: withFeatureFlag(false),
        });
      }).toThrow(
        "[useNavigationBarHeights] This hook requires the 'lwmWallet40' feature flag to be enabled",
      );
    });
  });

  describe("when lwmWallet40 feature flag is enabled", () => {
    it("should calculate top height including the insets top", () => {
      const { result } = renderHook(() => useNavigationBarHeights(), {
        overrideInitialState: withTabBarVisibility(true),
      });

      expect(result.current.top).toBe(124);
    });

    it("should return TAB_BAR_HEIGHT when tab bar is visible", () => {
      const { result } = renderHook(() => useNavigationBarHeights(), {
        overrideInitialState: withTabBarVisibility(true),
      });

      expect(result.current.bottom).toBe(TAB_BAR_HEIGHT);
    });

    it("should return 0 when tab bar is hidden", () => {
      const { result } = renderHook(() => useNavigationBarHeights(), {
        overrideInitialState: withTabBarVisibility(false),
      });

      expect(result.current.bottom).toBe(0);
    });

    it("should return TOP_BAR_BAR_HEIGHT as topBarHeight", () => {
      const { result } = renderHook(() => useNavigationBarHeights(), {
        overrideInitialState: withTabBarVisibility(true),
      });

      expect(result.current.topBarHeight).toBe(64);
    });

    it("should always return TAB_BAR_HEIGHT as bottomBarHeight", () => {
      const { result } = renderHook(() => useNavigationBarHeights(), {
        overrideInitialState: withTabBarVisibility(false),
      });

      expect(result.current.bottomBarHeight).toBe(TAB_BAR_HEIGHT);
    });
  });

  describe("when running on Android", () => {
    const originalOS = Platform.OS;

    beforeEach(() => {
      Platform.OS = "android";
    });

    afterEach(() => {
      Platform.OS = originalOS;
    });

    it("should use Android-specific top bar height with gradient", () => {
      const { result } = renderHook(() => useNavigationBarHeights(), {
        overrideInitialState: withTabBarVisibility(true),
      });

      expect(result.current.top).toBe(112);
    });
  });
});
