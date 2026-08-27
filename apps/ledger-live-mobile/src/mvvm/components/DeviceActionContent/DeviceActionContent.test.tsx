import React from "react";
import { render } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import * as platformModule from "@features/platform-device-action-content";
import { DeviceActionContent, supportedDeviceActionModelIds } from ".";

jest.mock("@features/platform-device-action-content", () => {
  const actual = jest.requireActual<typeof import("@features/platform-device-action-content")>(
    "@features/platform-device-action-content",
  );
  return {
    ...actual,
    DeviceActionContent: jest.fn(() => null),
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

  it("converts the legacy DeviceModelId and leaves the theme to the platform package", () => {
    render(
      <DeviceActionContent
        title="Continue on device"
        deviceName="Ledger Flex CDA1"
        deviceModelId={DeviceModelId.europa}
        action="continue"
      />,
    );

    expect(lastProps()).toEqual(
      expect.objectContaining({
        title: "Continue on device",
        deviceName: "Ledger Flex CDA1",
        deviceModelId: "europa",
        action: "continue",
      }),
    );
  });

  it("forwards an explicit theme override", () => {
    render(
      <DeviceActionContent
        deviceName="Ledger Flex CDA1"
        deviceModelId={DeviceModelId.europa}
        action="continue"
        theme="light"
      />,
    );

    expect(lastProps()).toEqual(expect.objectContaining({ theme: "light" }));
  });

  it("converts blue to null", () => {
    render(
      <DeviceActionContent
        deviceName="Ledger Blue"
        deviceModelId={DeviceModelId.blue}
        action="continue"
      />,
    );

    expect(lastProps()).toEqual(expect.objectContaining({ deviceModelId: null }));
  });

  it("lists every supported model id except blue", () => {
    expect(supportedDeviceActionModelIds).toEqual(
      Object.values(DeviceModelId).filter(modelId => modelId !== DeviceModelId.blue),
    );
    expect(supportedDeviceActionModelIds).not.toContain(DeviceModelId.blue);
  });

  // The platform package can't import DeviceModelId (legacy libs/ is forbidden in features/), so
  // its DeviceActionModelId union is hand-written. This is the only layer that sees both: it
  // fails if a device model is added to the enum without teaching the package about it, which
  // would otherwise silently render no animation.
  it("fails loudly when a supported model is missing from the platform union", () => {
    expect(
      supportedDeviceActionModelIds.filter(
        modelId => platformModule.toDeviceActionModelId(modelId) === null,
      ),
    ).toEqual([]);
  });
});
