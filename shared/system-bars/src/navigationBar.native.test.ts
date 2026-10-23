import { Platform } from "react-native";
import * as ExpoNavigationBar from "expo-navigation-bar";
import { applyNavigationBarTheme } from "./navigationBar.native";

jest.mock("expo-navigation-bar", () => ({
  setButtonStyleAsync: jest.fn(),
  setBackgroundColorAsync: jest.fn(),
}));

const mockedSetButtonStyleAsync = jest.mocked(ExpoNavigationBar.setButtonStyleAsync);
const mockedSetBackgroundColorAsync = jest.mocked(ExpoNavigationBar.setBackgroundColorAsync);

describe("applyNavigationBarTheme", () => {
  const initialOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedSetButtonStyleAsync.mockResolvedValue(undefined);
    mockedSetBackgroundColorAsync.mockResolvedValue(undefined);
  });

  afterEach(() => {
    Platform.OS = initialOS;
  });

  describe("on android", () => {
    beforeEach(() => {
      Platform.OS = "android";
    });

    it("paints the bar and uses dark buttons for a light theme", async () => {
      await applyNavigationBarTheme({ backgroundColor: "#FFFFFF", isDark: false });

      expect(mockedSetBackgroundColorAsync).toHaveBeenCalledWith("#FFFFFF");
      expect(mockedSetButtonStyleAsync).toHaveBeenCalledWith("dark");
    });

    it("paints the bar and uses light buttons for a dark theme", async () => {
      await applyNavigationBarTheme({ backgroundColor: "#131214", isDark: true });

      expect(mockedSetBackgroundColorAsync).toHaveBeenCalledWith("#131214");
      expect(mockedSetButtonStyleAsync).toHaveBeenCalledWith("light");
    });

    it("rejects when setting the button style fails", async () => {
      mockedSetButtonStyleAsync.mockRejectedValue(new Error("no activity"));

      await expect(
        applyNavigationBarTheme({ backgroundColor: "#FFFFFF", isDark: false }),
      ).rejects.toThrow("no activity");
    });

    it("rejects when painting the bar fails", async () => {
      mockedSetBackgroundColorAsync.mockRejectedValue(new Error("no activity"));

      await expect(
        applyNavigationBarTheme({ backgroundColor: "#FFFFFF", isDark: false }),
      ).rejects.toThrow("no activity");
    });
  });

  it("does nothing on ios", async () => {
    Platform.OS = "ios";

    await applyNavigationBarTheme({ backgroundColor: "#FFFFFF", isDark: false });

    expect(mockedSetButtonStyleAsync).not.toHaveBeenCalled();
    expect(mockedSetBackgroundColorAsync).not.toHaveBeenCalled();
  });
});
