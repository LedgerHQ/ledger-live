import { renderHook, act, withFlagOverrides } from "@tests/test-renderer";
import { useTabBarVisibility, useHideTabBar } from "../useTabBarVisibility";
import { State } from "~/reducers/types";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/reducers/settings";

const withBaseState = withFlagOverrides({}, (state: State) => ({
  ...state,
  settings: {
    ...SETTINGS_INITIAL_STATE,
  },
}));

const getStateWithVisibility = (isMainNavigatorVisible: boolean) => (state: State) => ({
  ...withBaseState(state),
  appstate: {
    ...state.appstate,
    isMainNavigatorVisible,
  },
});

describe("useTabBarVisibility", () => {
  describe("initial state", () => {
    it("should return correct initial visibility state", () => {
      const { result: resultTrue } = renderHook(() => useTabBarVisibility(), {
        overrideInitialState: getStateWithVisibility(true),
      });
      expect(resultTrue.current.isTabBarVisible).toBe(true);

      const { result: resultFalse } = renderHook(() => useTabBarVisibility(), {
        overrideInitialState: getStateWithVisibility(false),
      });
      expect(resultFalse.current.isTabBarVisible).toBe(false);
    });
  });

  describe("showTabBar", () => {
    it("should show the tab bar", () => {
      const { result, store } = renderHook(() => useTabBarVisibility(), {
        overrideInitialState: getStateWithVisibility(false),
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
        overrideInitialState: getStateWithVisibility(true),
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
        overrideInitialState: getStateWithVisibility(true),
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
  it("should hide tab bar on mount and restore on unmount", () => {
    const { unmount, store } = renderHook(() => useHideTabBar(), {
      overrideInitialState: getStateWithVisibility(true),
    });

    expect(store.getState().appstate.isMainNavigatorVisible).toBe(false);

    unmount();
    expect(store.getState().appstate.isMainNavigatorVisible).toBe(true);
  });

  it("should restore previous hidden state on unmount when initially hidden", () => {
    const { unmount, store } = renderHook(() => useHideTabBar(), {
      overrideInitialState: getStateWithVisibility(false),
    });

    expect(store.getState().appstate.isMainNavigatorVisible).toBe(false);

    unmount();
    expect(store.getState().appstate.isMainNavigatorVisible).toBe(false);
  });
});
