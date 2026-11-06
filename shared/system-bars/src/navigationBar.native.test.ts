import { Platform } from "react-native";
import { NavigationBar } from "expo-navigation-bar";
import { applyNavigationBarTheme } from "./navigationBar";

jest.mock("expo-navigation-bar", () => ({
  NavigationBar: { setStyle: jest.fn() },
}));

const mockedSetStyle = jest.mocked(NavigationBar.setStyle);

describe("applyNavigationBarTheme", () => {
  const initialOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    Platform.OS = initialOS;
  });

  describe("on android", () => {
    beforeEach(() => {
      Platform.OS = "android";
    });

    it("uses dark buttons for a light theme", () => {
      applyNavigationBarTheme({ isDark: false });

      expect(mockedSetStyle).toHaveBeenCalledWith("dark");
    });

    it("uses light buttons for a dark theme", () => {
      applyNavigationBarTheme({ isDark: true });

      expect(mockedSetStyle).toHaveBeenCalledWith("light");
    });
  });

  it("does nothing on ios", () => {
    Platform.OS = "ios";

    applyNavigationBarTheme({ isDark: false });

    expect(mockedSetStyle).not.toHaveBeenCalled();
  });
});
