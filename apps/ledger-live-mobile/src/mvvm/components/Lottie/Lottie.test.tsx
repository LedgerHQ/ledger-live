import React from "react";
import { render, screen } from "@tests/test-renderer";
import { Lottie } from "./index";

describe("Lottie", () => {
  beforeEach(() => {
    const Config = require("react-native-config").default;
    Config.DETOX = undefined;
  });

  it("renders LottieView when source has uri", () => {
    render(<Lottie source={{ uri: "file:///test.lottie" }} />);
    expect(screen.getByTestId("lottie-source")).toBeOnTheScreen();
    expect(screen.getByTestId("lottie-mock")).toBeOnTheScreen();
    expect(screen.getByTestId("lottie-source").props.children).toContain("file:///test.lottie");
  });

  it("renders empty view when source is null", () => {
    render(<Lottie source={null} />);
    expect(screen.queryByTestId("lottie-mock")).toBeNull();
  });

  it("renders empty view when source has no uri", () => {
    render(<Lottie source={{ width: 1, height: 1 } as unknown as { uri: string }} />);
    expect(screen.queryByTestId("lottie-mock")).toBeNull();
  });

  it("uses default testID for detox view", () => {
    const Config = require("react-native-config").default;
    Config.DETOX = "1";
    render(<Lottie source={{ uri: "file:///test.lottie" }} />);
    expect(screen.getByTestId("lottie-detox")).toBeOnTheScreen();
    expect(screen.queryByTestId("lottie-mock")).toBeNull();
    Config.DETOX = undefined;
  });

  it("uses custom testID for detox view when provided", () => {
    const Config = require("react-native-config").default;
    Config.DETOX = "1";
    render(<Lottie source={{ uri: "file:///test.lottie" }} testID="splash-lottie" />);
    expect(screen.getByTestId("splash-lottie-detox")).toBeOnTheScreen();
    expect(screen.queryByTestId("lottie-mock")).toBeNull();
    Config.DETOX = undefined;
  });
});
