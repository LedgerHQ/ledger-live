import React from "react";
import { View, Text, Image } from "react-native";
import { render, screen, waitFor } from "@testing-library/react-native";
import { AppLoadingManager } from "../index";

jest.mock("react-native-splash-screen", () => ({
  hide: jest.fn(),
}));

const mockResolveAssetSource = jest.fn(() => ({
  uri: "file:///splash.lottie",
  width: 1,
  height: 1,
  scale: 1,
}));

describe("LaunchScreen feature", () => {
  beforeAll(() => {
    jest.spyOn(Image, "resolveAssetSource").mockImplementation(mockResolveAssetSource);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    const Config = require("react-native-config").default;
    Config.DETOX = undefined;
  });

  it("should show LottieLauncher when loading and navigation is not ready", async () => {
    render(
      <AppLoadingManager isNavigationReady={false}>
        <View testID="app-content">
          <Text>App content</Text>
        </View>
      </AppLoadingManager>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("lottie-source")).toBeOnTheScreen();
    });
  });

  it("should render children only when DETOX is enabled", () => {
    const Config = require("react-native-config").default;
    Config.DETOX = "1";

    render(
      <AppLoadingManager isNavigationReady={false}>
        <View testID="app-content">
          <Text>App content</Text>
        </View>
      </AppLoadingManager>,
    );

    expect(screen.getByTestId("app-content")).toBeOnTheScreen();
    expect(screen.queryByTestId("lottie-launcher")).toBeNull();

    Config.DETOX = undefined;
  });
});
