import React from "react";
import { Image } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { Lottie, resolveLottieSource } from "./index";

describe("Lottie", () => {
  beforeEach(() => {
    const Config = require("react-native-config").default;
    Config.DETOX = undefined;
  });

  it("renders LottieView when source has uri", () => {
    render(<Lottie source={{ uri: "file:///test.lottie" }} />);
    expect(screen.getByTestId("lottie-source")).toBeOnTheScreen();
    expect(screen.getByTestId("lottie")).toBeOnTheScreen();
    expect(screen.getByTestId("lottie-source").props.children).toContain("file:///test.lottie");
  });

  it("renders empty view when source is null", () => {
    render(<Lottie source={null} />);
    expect(screen.queryByTestId("lottie")).toBeNull();
  });

  it("renders empty view when source has no uri", () => {
    render(<Lottie source={{ width: 1, height: 1 } as unknown as { uri: string }} />);
    expect(screen.queryByTestId("lottie")).toBeNull();
  });

  it("renders LottieView when source is numeric asset id", () => {
    render(<Lottie source={123} />);
    expect(screen.getByTestId("lottie")).toBeOnTheScreen();
    expect(screen.getByTestId("lottie-source")).toBeOnTheScreen();
    expect(screen.getByTestId("lottie-source").props.children).toContain("123");
  });

  describe("resolveLottieSource", () => {
    it("returns numeric module id when Repack returns relative path (not file:// or http(s)://)", () => {
      const moduleId = 123;
      const spy = jest.spyOn(Image, "resolveAssetSource").mockReturnValue({
        uri: "assets/splash.lottie",
        width: 1,
        height: 1,
        scale: 1,
      } as ReturnType<typeof Image.resolveAssetSource>);

      const result = resolveLottieSource(moduleId);

      expect(result).toBe(moduleId);
      spy.mockRestore();
    });

    it("returns uri object when Image.resolveAssetSource returns file:// URI", () => {
      const moduleId = 456;
      const spy = jest.spyOn(Image, "resolveAssetSource").mockReturnValue({
        uri: "file:///path/to/splash.lottie",
        width: 1,
        height: 1,
        scale: 1,
      } as ReturnType<typeof Image.resolveAssetSource>);

      const result = resolveLottieSource(moduleId);

      expect(result).toEqual({ uri: "file:///path/to/splash.lottie" });
      spy.mockRestore();
    });
  });

  it("uses default testID for detox view", () => {
    const Config = require("react-native-config").default;
    Config.DETOX = "1";
    render(<Lottie source={{ uri: "file:///test.lottie" }} />);
    expect(screen.getByTestId("lottie-detox")).toBeOnTheScreen();
    expect(screen.queryByTestId("lottie")).toBeNull();
    Config.DETOX = undefined;
  });

  it("uses custom testID for detox view when provided", () => {
    const Config = require("react-native-config").default;
    Config.DETOX = "1";
    render(<Lottie source={{ uri: "file:///test.lottie" }} testID="splash-lottie" />);
    expect(screen.getByTestId("splash-lottie-detox")).toBeOnTheScreen();
    expect(screen.queryByTestId("lottie")).toBeNull();
    Config.DETOX = undefined;
  });
});
