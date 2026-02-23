import { renderHook, act } from "@tests/test-renderer";
import { useTabBarVisibility, useHideTabBar } from "../useTabBarVisibility";
import { State } from "~/reducers/types";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/reducers/settings";

// Helper to create state with lwmWallet40 feature flag
const withFeatureFlag = (enabled: boolean, params?: Record<string, unknown>) => (state: State) => ({
  ...state,
  settings: {
    ...SETTINGS_INITIAL_STATE,
    overriddenFeatureFlags: {
      lwmWallet40: {
        enabled,
        ...(params && { params }),
      },
    },
  },
});

describe("useTabBarVisibility", () => {
  describe("when lwmWallet40 feature flag is disabled", () => {
    it("should throw error with descriptive message", () => {
      expect(() => {
        renderHook(() => useTabBarVisibility(), {
          overrideInitialState: withFeatureFlag(false),
        });
      }).toThrow(
        "[useTabBarVisibility] This hook requires the 'lwmWallet40' feature flag to be enabled",
      );
    });

    it("should include guidance in error message", () => {
      expect(() => {
        renderHook(() => useTabBarVisibility(), {
          overrideInitialState: withFeatureFlag(false),
        });
      }).toThrow(
        "Ensure that any component using this hook is only rendered within Wallet 4.0-gated navigation trees",
      );
    });
  });

  describe("when lwmWallet40 feature flag is enabled", () => {
    const getStateWithFeatureFlag = (isMainNavigatorVisible: boolean) => (state: State) => ({
      ...withFeatureFlag(true, { mainNavigation: true })(state),
      appstate: {
        ...state.appstate,
        isMainNavigatorVisible,
      },
    });

    describe("initial state", () => {
      it("should return correct initial visibility state", () => {
        const { result: resultTrue } = renderHook(() => useTabBarVisibility(), {
          overrideInitialState: getStateWithFeatureFlag(true),
        });
        expect(resultTrue.current.isTabBarVisible).toBe(true);

        const { result: resultFalse } = renderHook(() => useTabBarVisibility(), {
          overrideInitialState: getStateWithFeatureFlag(false),
        });
        expect(resultFalse.current.isTabBarVisible).toBe(false);
      });
    });

    describe("showTabBar", () => {
      it("should show the tab bar", () => {
        const { result, store } = renderHook(() => useTabBarVisibility(), {
          overrideInitialState: getStateWithFeatureFlag(false),
        });

        act(() => {
          result.current.showTabBar();
        });

        expect(store.getState().appstate.isMainNavigatorVisible).toBe(true);
        expect(result.current.isTabBarVisible).toBe(true);
      });
    });

    describe("hideTabBar", () => {
      it("should hide the tab bar", () => {
        const { result, store } = renderHook(() => useTabBarVisibility(), {
          overrideInitialState: getStateWithFeatureFlag(true),
        });

        act(() => {
          result.current.hideTabBar();
        });

        expect(store.getState().appstate.isMainNavigatorVisible).toBe(false);
        expect(result.current.isTabBarVisible).toBe(false);
      });
    });

    describe("integration scenarios", () => {
      it("should support show/hide toggling", () => {
        const { result } = renderHook(() => useTabBarVisibility(), {
          overrideInitialState: getStateWithFeatureFlag(true),
        });

        act(() => {
          result.current.hideTabBar();
        });
        expect(result.current.isTabBarVisible).toBe(false);

        act(() => {
          result.current.showTabBar();
        });
        expect(result.current.isTabBarVisible).toBe(true);
      });
    });
  });

  describe("useHideTabBar", () => {
    const getStateWithVisibility = (isVisible: boolean) => (state: State) => ({
      ...withFeatureFlag(true, { mainNavigation: true })(state),
      appstate: {
        ...state.appstate,
        isMainNavigatorVisible: isVisible,
      },
    });

    it("should hide tab bar on mount and restore on unmount", () => {
      const { unmount, store } = renderHook(() => useHideTabBar(), {
        overrideInitialState: getStateWithVisibility(true),
      });

      // Should be hidden after mount
      expect(store.getState().appstate.isMainNavigatorVisible).toBe(false);

      // Unmount and verify restoration
      unmount();
      expect(store.getState().appstate.isMainNavigatorVisible).toBe(true);
    });

    it("should throw error when feature flag is disabled", () => {
      expect(() => {
        renderHook(() => useHideTabBar(), {
          overrideInitialState: withFeatureFlag(false),
        });
      }).toThrow("[useTabBarVisibility] This hook requires the 'lwmWallet40' feature flag");
    });

    it("should restore previous hidden state on unmount when initially hidden", () => {
      const { unmount, store } = renderHook(() => useHideTabBar(), {
        overrideInitialState: getStateWithVisibility(false),
      });

      // Should remain hidden after mount (it was already hidden)
      expect(store.getState().appstate.isMainNavigatorVisible).toBe(false);

      // Unmount and verify the original hidden state is restored
      unmount();
      expect(store.getState().appstate.isMainNavigatorVisible).toBe(false);
    });
  });
});
