import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import * as animationModule from "./getDeviceActionAnimation";
import { DeviceActionContent } from ".";

jest.mock("./getDeviceActionAnimation", () => {
  const actual =
    jest.requireActual<typeof import("./getDeviceActionAnimation")>("./getDeviceActionAnimation");
  return {
    ...actual,
    getDeviceActionAnimation: jest.fn(actual.getDeviceActionAnimation),
  };
});

describe("DeviceActionContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title, description, device label, and banner", () => {
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
        deviceModelId={DeviceModelId.europa}
        action="continue"
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
        deviceModelId={DeviceModelId.apex}
        action="continue"
      />,
    );

    expect(screen.queryByText("Continue on device")).toBeNull();
    expect(screen.queryByText("Keep the device connected")).toBeNull();
    expect(screen.getByText("Ledger Apex CDA1")).toBeVisible();
  });

  it("uses the current styled theme when no animation theme override is provided", () => {
    render(
      <DeviceActionContent
        title="Continue on device"
        description="Follow the instructions on your Ledger."
        deviceName="Ledger Flex CDA1"
        deviceModelId={DeviceModelId.europa}
        action="continue"
      />,
    );

    expect(animationModule.getDeviceActionAnimation).toHaveBeenLastCalledWith({
      action: "continue",
      modelId: DeviceModelId.europa,
      theme: "dark",
    });
  });

  it("uses the explicit animation theme override when provided", () => {
    render(
      <DeviceActionContent
        title="Continue on device"
        description="Follow the instructions on your Ledger."
        deviceName="Ledger Flex CDA1"
        deviceModelId={DeviceModelId.europa}
        action="continue"
        theme="light"
      />,
    );

    expect(animationModule.getDeviceActionAnimation).toHaveBeenLastCalledWith({
      action: "continue",
      modelId: DeviceModelId.europa,
      theme: "light",
    });
  });
});
