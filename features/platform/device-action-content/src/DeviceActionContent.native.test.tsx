import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ThemeContext } from "styled-components/native";
import * as animationModule from "./getDeviceActionAnimation.native";
import { DeviceActionContent } from "./DeviceActionContent.native";

jest.mock("react-native-config", () => ({
  __esModule: true,
  default: { DETOX: false },
}));

jest.mock("lottie-react-native", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: function MockLottie({ testID }: { testID?: string }) {
      return React.createElement(View, { testID });
    },
  };
});

jest.mock("./getDeviceActionAnimation.native", () => {
  const actual = jest.requireActual<typeof import("./getDeviceActionAnimation.native")>(
    "./getDeviceActionAnimation.native",
  );
  return {
    ...actual,
    getDeviceActionAnimation: jest.fn(actual.getDeviceActionAnimation),
  };
});

describe("DeviceActionContent (native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title, description, device label, and banner", () => {
    render(
      <DeviceActionContent
        title="Unlock your device"
        description="Enter your PIN code to continue."
        deviceName="Ledger Flex CDA1"
        deviceModelId="europa"
        action="power-and-unlock"
        theme="dark"
        banner={{
          title: "Keep the device connected",
          description: "Do not disconnect your Ledger.",
        }}
      />,
    );

    expect(screen.getByText("Unlock your device")).toBeTruthy();
    expect(screen.getByText("Enter your PIN code to continue.")).toBeTruthy();
    expect(screen.getByText("Ledger Flex CDA1")).toBeTruthy();
    expect(screen.getByText("Keep the device connected")).toBeTruthy();
    expect(screen.getByText("Do not disconnect your Ledger.")).toBeTruthy();
  });

  it("renders the root container and animation", () => {
    render(
      <DeviceActionContent
        title="Continue on device"
        description="Follow the instructions on your Ledger."
        deviceName="Ledger Flex CDA1"
        deviceModelId="europa"
        action="continue"
        theme="light"
        testID="device-action-content"
      />,
    );

    expect(screen.getByTestId("device-action-content")).toBeTruthy();
    expect(screen.getByTestId("device-action-content-animation")).toBeTruthy();
  });

  it("hides optional title, description, and banner when props are omitted", () => {
    render(
      <DeviceActionContent
        deviceName="Ledger Apex CDA1"
        deviceModelId="apex"
        action="continue"
        theme="light"
      />,
    );

    expect(screen.queryByText("Continue on device")).toBeNull();
    expect(screen.queryByText("Keep the device connected")).toBeNull();
    expect(screen.getByText("Ledger Apex CDA1")).toBeTruthy();
  });

  it("resolves the animation from the mounted provider when no theme prop is given", () => {
    render(
      <ThemeContext.Provider value={{ theme: "dark" } as never}>
        <DeviceActionContent
          deviceName="Ledger Flex CDA1"
          deviceModelId="europa"
          action="continue"
        />
      </ThemeContext.Provider>,
    );

    expect(animationModule.getDeviceActionAnimation).toHaveBeenLastCalledWith({
      action: "continue",
      modelId: "europa",
      theme: "dark",
    });
  });

  it("renders without a provider, defaulting to the light asset", () => {
    render(
      <DeviceActionContent
        deviceName="Ledger Flex CDA1"
        deviceModelId="europa"
        action="continue"
      />,
    );

    expect(animationModule.getDeviceActionAnimation).toHaveBeenLastCalledWith({
      action: "continue",
      modelId: "europa",
      theme: "light",
    });
  });

  it("resolves the animation using the given theme", () => {
    render(
      <DeviceActionContent
        title="Continue on device"
        deviceName="Ledger Flex CDA1"
        deviceModelId="europa"
        action="continue"
        theme="dark"
      />,
    );

    expect(animationModule.getDeviceActionAnimation).toHaveBeenLastCalledWith({
      action: "continue",
      modelId: "europa",
      theme: "dark",
    });
  });

  it("omits the animation block when deviceModelId is null", () => {
    render(
      <DeviceActionContent
        deviceName="Ledger Blue"
        deviceModelId={null}
        action="continue"
        theme="light"
        testID="device-action-content"
      />,
    );

    expect(animationModule.getDeviceActionAnimation).not.toHaveBeenCalled();
    expect(screen.queryByTestId("device-action-content-animation")).toBeNull();
    expect(screen.getByText("Ledger Blue")).toBeTruthy();
  });
});
