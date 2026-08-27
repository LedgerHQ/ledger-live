import SplashScreen from "react-native-splash-screen";
import { fadeNativeSplash, resetNativeSplashFade } from "../fadeNativeSplash";

jest.mock("react-native-splash-screen", () => ({
  hide: jest.fn(),
  show: jest.fn(),
}));

describe("fadeNativeSplash", () => {
  beforeEach(() => {
    resetNativeSplashFade();
    jest.clearAllMocks();
  });

  it("should hide the native splash only once", () => {
    expect(fadeNativeSplash()).toBe(true);
    expect(fadeNativeSplash()).toBe(false);
    expect(SplashScreen.hide).toHaveBeenCalledTimes(1);
  });

  it("should hide again after resetNativeSplashFade", () => {
    fadeNativeSplash();
    resetNativeSplashFade();
    expect(fadeNativeSplash()).toBe(true);
    expect(SplashScreen.hide).toHaveBeenCalledTimes(2);
  });
});
