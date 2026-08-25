import React from "react";
import { render } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/types-devices";
import * as platformModule from "@features/platform-device-action-content";
import { DeviceActionContent, supportedDeviceActionModelIds } from ".";

jest.mock("@features/platform-device-action-content", () => {
  const actual = jest.requireActual<typeof import("@features/platform-device-action-content")>(
    "@features/platform-device-action-content",
  );
  return {
    ...actual,
    DeviceActionContent: jest.fn(() => <div data-testid="platform-device-action-content" />),
  };
});

const mockedPlatformDeviceActionContent = jest.mocked(platformModule.DeviceActionContent);

function lastProps() {
  return mockedPlatformDeviceActionContent.mock.calls.at(-1)?.[0];
}

describe("DeviceActionContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GIVEN a supported device model WHEN rendered THEN it converts the model id and resolves the current app theme", () => {
    // GIVEN / WHEN
    render(
      <DeviceActionContent
        title="Continue on device"
        deviceName="Ledger Flex CDA1"
        deviceModelId={DeviceModelId.europa}
        action="continue"
      />,
    );

    // THEN
    expect(lastProps()).toEqual(
      expect.objectContaining({
        title: "Continue on device",
        deviceName: "Ledger Flex CDA1",
        deviceModelId: "europa",
        action: "continue",
        theme: "dark",
      }),
    );
  });

  it("GIVEN an explicit theme override WHEN rendered THEN it uses the override instead of the app theme", () => {
    // GIVEN / WHEN
    render(
      <DeviceActionContent
        deviceName="Ledger Flex CDA1"
        deviceModelId={DeviceModelId.europa}
        action="continue"
        theme="light"
      />,
    );

    // THEN
    expect(lastProps()).toEqual(expect.objectContaining({ theme: "light" }));
  });

  it("GIVEN the blue device model WHEN rendered THEN it converts it to null", () => {
    // GIVEN / WHEN
    render(
      <DeviceActionContent
        deviceName="Ledger Blue"
        deviceModelId={DeviceModelId.blue}
        action="continue"
      />,
    );

    // THEN
    expect(lastProps()).toEqual(expect.objectContaining({ deviceModelId: null }));
  });

  it("GIVEN every DeviceModelId WHEN listing supported models THEN it excludes blue", () => {
    // GIVEN / WHEN / THEN
    expect(supportedDeviceActionModelIds).toEqual(
      Object.values(DeviceModelId).filter(modelId => modelId !== DeviceModelId.blue),
    );
    expect(supportedDeviceActionModelIds).not.toContain(DeviceModelId.blue);
  });
});
