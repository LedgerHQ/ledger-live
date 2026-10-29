import { act, renderHook } from "@tests/test-renderer";
import { hide } from "expo-splash-screen";
import { hideSplashScreen, useIsSplashScreenHidden } from "../splashScreenVisibility";

describe("splashScreenVisibility", () => {
  it("reports the splash screen as hidden once hideSplashScreen runs", () => {
    const { result } = renderHook(() => useIsSplashScreenHidden());
    expect(result.current).toBe(false);

    act(() => hideSplashScreen());

    expect(hide).toHaveBeenCalled();
    expect(result.current).toBe(true);
  });
});
