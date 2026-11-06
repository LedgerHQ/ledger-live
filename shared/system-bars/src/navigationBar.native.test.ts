import { Platform } from "react-native";
import { NavigationBar } from "expo-navigation-bar";
import { applyNavigationBarTheme } from "./navigationBar";

jest.mock("react-native", () => ({
  ...jest.requireActual("react-native"),
  processColor: (color: string) =>
    /^#[0-9a-f]{6}$/i.test(color) ? Number.parseInt(`ff${color.slice(1)}`, 16) | 0 : null,
}));

jest.mock("expo-navigation-bar", () => ({
  NavigationBar: { setStyle: jest.fn() },
}));

const mockedSetStyle = jest.mocked(NavigationBar.setStyle);
const paintBackground = jest.fn();
const OPAQUE_WHITE = 0xffffffff;

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
      applyNavigationBarTheme({ isDark: false, backgroundColor: "#FFFFFF", paintBackground });

      expect(mockedSetStyle).toHaveBeenCalledWith("dark");
    });

    it("uses light buttons for a dark theme", () => {
      applyNavigationBarTheme({ isDark: true, backgroundColor: "#000000", paintBackground });

      expect(mockedSetStyle).toHaveBeenCalledWith("light");
    });

    it("paints the bar with the background color as an ARGB number", () => {
      applyNavigationBarTheme({ isDark: false, backgroundColor: "#FFFFFF", paintBackground });

      expect(paintBackground).toHaveBeenCalledTimes(1);
      const [color] = paintBackground.mock.calls[0];
      expect(color >>> 0).toBe(OPAQUE_WHITE);
    });

    it("only sets the button color, without warning, when no painter is given", () => {
      const consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});

      applyNavigationBarTheme({ isDark: true, backgroundColor: "not-a-color" });

      expect(mockedSetStyle).toHaveBeenCalledWith("light");
      expect(consoleWarn).not.toHaveBeenCalled();
      consoleWarn.mockRestore();
    });

    it("does not paint the bar when the color is invalid", () => {
      const consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});

      applyNavigationBarTheme({ isDark: false, backgroundColor: "not-a-color", paintBackground });

      expect(paintBackground).not.toHaveBeenCalled();
      expect(consoleWarn).toHaveBeenCalled();
      consoleWarn.mockRestore();
    });
  });

  it("does nothing on ios", () => {
    Platform.OS = "ios";

    applyNavigationBarTheme({ isDark: false, backgroundColor: "#FFFFFF", paintBackground });

    expect(mockedSetStyle).not.toHaveBeenCalled();
    expect(paintBackground).not.toHaveBeenCalled();
  });
});
