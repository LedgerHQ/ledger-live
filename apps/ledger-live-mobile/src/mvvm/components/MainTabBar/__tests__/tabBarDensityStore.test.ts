import { renderHook, act } from "@tests/test-renderer";
import {
  acknowledgeTabBarCompact,
  tabBarDensity,
  resetTabBarDensity,
  setTabBarCompact,
  tabBarCompactOnUI,
  tabBarResetGenerationOnUI,
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

  it("should move to a new reset generation on reset", () => {
    const before = tabBarDensity.getResetGeneration();

    resetTabBarDensity();

    expect(tabBarDensity.getResetGeneration()).toBe(before + 1);
    expect(tabBarResetGenerationOnUI.value).toBe(before + 1);
  });

  it("should drop a UI thread acknowledgement computed before the last reset", () => {
    const { result } = renderHook(() => useIsTabBarCompact());
    const staleGeneration = tabBarDensity.getResetGeneration();
    act(() => resetTabBarDensity());

    act(() => acknowledgeTabBarCompact(true, staleGeneration));

    expect(result.current).toBe(false);
  });

  it("should not overwrite a newer UI thread decision with a late acknowledgement", () => {
    const { result } = renderHook(() => useIsTabBarCompact());
    const generation = tabBarDensity.getResetGeneration();
    tabBarCompactOnUI.value = false;

    act(() => acknowledgeTabBarCompact(true, generation));

    expect(result.current).toBe(true);
    expect(tabBarCompactOnUI.value).toBe(false);
  });
});
