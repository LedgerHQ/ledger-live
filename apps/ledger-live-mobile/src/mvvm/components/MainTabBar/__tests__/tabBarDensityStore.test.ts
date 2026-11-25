import { renderHook, act } from "@tests/test-renderer";
import {
  resetTabBarDensity,
  setTabBarCompact,
  tabBarCompactOnUI,
  useIsTabBarCompact,
} from "../tabBarDensityStore";

describe("tabBarDensityStore", () => {
  afterEach(() => {
    resetTabBarDensity();
  });

  it("should be expanded by default", () => {
    const { result } = renderHook(() => useIsTabBarCompact());

    expect(result.current).toBe(false);
  });

  it("should notify readers when the tab bar compacts", () => {
    const { result } = renderHook(() => useIsTabBarCompact());

    act(() => setTabBarCompact(true));

    expect(result.current).toBe(true);
    expect(tabBarCompactOnUI.value).toBe(true);
  });

  it("should expand again on reset", () => {
    const { result } = renderHook(() => useIsTabBarCompact());
    act(() => setTabBarCompact(true));

    act(() => resetTabBarDensity());

    expect(result.current).toBe(false);
    expect(tabBarCompactOnUI.value).toBe(false);
  });

  it("should resync the UI thread mirror on reset when it is ahead of the JS state", () => {
    tabBarCompactOnUI.value = true;

    resetTabBarDensity();

    expect(tabBarCompactOnUI.value).toBe(false);
  });
});
