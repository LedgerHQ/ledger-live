import { act, renderHook } from "@tests/test-renderer";
import { hide } from "expo-splash-screen";
import {
  hideSplashScreen,
  SPLASH_SCREEN_FADE_MS,
  useIsSplashScreenHidden,
} from "../splashScreenVisibility";

describe("splashScreenVisibility", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("reports the splash screen as hidden once its fade-out is over", () => {
    const { result } = renderHook(() => useIsSplashScreenHidden());
    expect(result.current).toBe(false);

    act(() => hideSplashScreen());
    expect(hide).toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(SPLASH_SCREEN_FADE_MS));
    expect(result.current).toBe(false);

    act(() => jest.runOnlyPendingTimers());
    expect(result.current).toBe(true);
  });
});
