import React from "react";
import { render, screen } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/types-devices";
import * as animationModule from "./getDeviceActionAnimation";
import { DeviceActionContent } from ".";

jest.mock("~/renderer/animations", () => ({
  __esModule: true,
  default: () => <div data-testid="device-action-lottie" />,
}));

jest.mock("./getDeviceActionAnimation", () => {
  const actual = jest.requireActual<typeof import("./getDeviceActionAnimation")>(
    "./getDeviceActionAnimation",
  );
  return {
    ...actual,
    getDeviceActionAnimation: jest.fn(actual.getDeviceActionAnimation),
  };
});

describe("DeviceActionContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GIVEN title description device label and banner WHEN rendered THEN it displays all of them", () => {
    // GIVEN / WHEN
    render(
      <DeviceActionContent
        title="Unlock your device"
        description="Enter your PIN code to continue."
        deviceName="Ledger Flex CDA1"
        deviceModelId={DeviceModelId.europa}
        action="power-and-unlock"
        banner={{
          title: "Keep the device connected",
          description: "Do not disconnect your Ledger.",
        }}
      />,
    );

    // THEN
    expect(screen.getByText("Unlock your device")).toBeVisible();
    expect(screen.getByText("Enter your PIN code to continue.")).toBeVisible();
    expect(screen.getByText("Ledger Flex CDA1")).toBeVisible();
    expect(screen.getByText("Keep the device connected")).toBeVisible();
    expect(screen.getByText("Do not disconnect your Ledger.")).toBeVisible();
  });

  it("GIVEN a test id WHEN rendered THEN it renders the root container and animation", () => {
    // GIVEN / WHEN
    render(
      <DeviceActionContent
        title="Continue on device"
        description="Follow the instructions on your Ledger."
        deviceName="Ledger Flex CDA1"
        deviceModelId={DeviceModelId.europa}
        action="continue"
        testID="device-action-content"
      />,
    );

    // THEN
    expect(screen.getByTestId("device-action-content")).toBeVisible();
    expect(screen.getByTestId("device-action-content-animation")).toBeVisible();
  });

  it("GIVEN optional copy and banner are omitted WHEN rendered THEN it only displays the device label", () => {
    // GIVEN / WHEN
    render(
      <DeviceActionContent
        deviceName="Ledger Apex CDA1"
        deviceModelId={DeviceModelId.apex}
        action="continue"
      />,
    );

    // THEN
    expect(screen.queryByText("Continue on device")).toBeNull();
    expect(screen.queryByText("Keep the device connected")).toBeNull();
    expect(screen.getByText("Ledger Apex CDA1")).toBeVisible();
  });

  it("GIVEN a rendered content WHEN resolving the animation THEN it uses the current app theme", () => {
    // GIVEN / WHEN
    render(
      <DeviceActionContent
        title="Continue on device"
        description="Follow the instructions on your Ledger."
        deviceName="Ledger Flex CDA1"
        deviceModelId={DeviceModelId.europa}
        action="continue"
      />,
    );

    // THEN
    expect(animationModule.getDeviceActionAnimation).toHaveBeenLastCalledWith({
      action: "continue",
      modelId: DeviceModelId.europa,
      theme: "dark",
    });
  });
});
