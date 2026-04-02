import React from "react";
import { render, screen } from "@tests/test-renderer";
import PerpsSignScreen from "../PerpsSignScreen";

jest.mock("~/hooks/deviceActions", () => ({
  useAppDeviceAction: () => ({ action: "mock-action" }),
}));

jest.mock("~/components/SelectDevice2", () => {
  const { View, Text } = require("react-native");
  return {
    __esModule: true,
    default: () => (
      <View testID="select-device">
        <Text>SelectDevice</Text>
      </View>
    ),
  };
});

const mockNavigation = {
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(),
};

const mockRoute = {
  params: {
    appName: "Hyperliquid",
    appOptions: {
      requireLatestFirmware: false,
      allowPartialDependencies: false,
      skipAppInstallIfNotFound: false,
    },
    signFactory: jest.fn().mockResolvedValue({ signatures: [] }),
    onSuccess: jest.fn(),
    onError: jest.fn(),
    onCancel: jest.fn(),
  },
};

describe("PerpsSign integration", () => {
  it("should render the device selection screen", () => {
    render(
      <PerpsSignScreen navigation={mockNavigation as never} route={mockRoute as never} />,
    );

    expect(screen.getByTestId("select-device")).toBeOnTheScreen();
  });
});
