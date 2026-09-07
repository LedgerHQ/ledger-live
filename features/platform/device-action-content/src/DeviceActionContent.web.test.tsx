import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import * as animationModule from "./getDeviceActionAnimation.web";
import { DeviceActionContent } from "./DeviceActionContent.web";

jest.mock("react-lottie", () => ({
  __esModule: true,
  default: () => <div data-testid="device-action-lottie" />,
}));

jest.mock("./getDeviceActionAnimation.web", () => {
  const actual = jest.requireActual<typeof import("./getDeviceActionAnimation.web")>(
    "./getDeviceActionAnimation.web",
  );
  return {
    ...actual,
    getDeviceActionAnimation: jest.fn(actual.getDeviceActionAnimation),
  };
});

describe("DeviceActionContent (web)", () => {
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

    expect(screen.getByText("Unlock your device")).toBeVisible();
    expect(screen.getByText("Enter your PIN code to continue.")).toBeVisible();
    expect(screen.getByText("Ledger Flex CDA1")).toBeVisible();
    expect(screen.getByText("Keep the device connected")).toBeVisible();
    expect(screen.getByText("Do not disconnect your Ledger.")).toBeVisible();
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

    expect(screen.getByTestId("device-action-content")).toBeVisible();
    expect(screen.getByTestId("device-action-content-animation")).toBeVisible();
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
    expect(screen.getByText("Ledger Apex CDA1")).toBeVisible();
  });

  it("resolves the animation from the mounted provider when no theme prop is given", () => {
    render(
      <ThemeProvider theme={{ theme: "dark" } as never}>
        <DeviceActionContent
          deviceName="Ledger Flex CDA1"
          deviceModelId="europa"
          action="continue"
        />
      </ThemeProvider>,
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
    expect(screen.getByText("Ledger Blue")).toBeVisible();
  });
});
