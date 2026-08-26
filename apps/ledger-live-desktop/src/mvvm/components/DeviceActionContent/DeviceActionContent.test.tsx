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

  it("GIVEN a supported device model WHEN rendered THEN it converts the model id and leaves the theme to the platform package", () => {
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
      }),
    );
  });

  it("GIVEN an explicit theme override WHEN rendered THEN it forwards the override", () => {
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

  // The platform package can't import DeviceModelId (legacy libs/ is forbidden in features/), so
  // its DeviceActionModelId union is hand-written. This is the only layer that sees both: it
  // fails if a device model is added to the enum without teaching the package about it, which
  // would otherwise silently render no animation.
  it("GIVEN a new device model WHEN it is missing from the platform union THEN the conversion fails loudly", () => {
    // GIVEN / WHEN / THEN
    expect(
      supportedDeviceActionModelIds.filter(
        modelId => platformModule.toDeviceActionModelId(modelId) === null,
      ),
    ).toEqual([]);
  });
});
