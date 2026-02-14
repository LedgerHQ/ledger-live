import React from "react";
import { render, screen } from "tests/testSetup";
import Dashboard from "../Dashboard";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceInfo } from "@ledgerhq/types-live";

jest.mock("../DeviceDashboard", () => ({
  __esModule: true,
  default: () => <div data-testid="device-dashboard">DeviceDashboard</div>,
}));

jest.mock("../FirmwareUpdate", () => ({
  __esModule: true,
  default: () => <div data-testid="firmware-update">FirmwareUpdate</div>,
}));

describe("Dashboard", () => {
  const dashboardProps = {
    device: {
      deviceId: "test-device",
      modelId: DeviceModelId.nanoX,
    } as Device,
    deviceInfo: {
      version: "1.0.0",
      isOSU: false,
      mcuVersion: "1.0",
      languageId: 0,
    } as DeviceInfo & { languageId: number },
    onRefreshDeviceInfo: jest.fn(),
    onReset: jest.fn(),
    appsToRestore: [],
    result: null,
  };

  it("renders FirmwareUpdate when result is null", () => {
    render(<Dashboard {...dashboardProps} />);
    expect(screen.getByTestId("firmware-update")).toBeInTheDocument();
    expect(screen.queryByTestId("device-dashboard")).toBeNull();
  });

  it("renders DeviceDashboard when result is provided", () => {
    const result = {
      appByName: {},
      appsListNames: [],
      installedAvailable: true,
      installed: [],
      installedLanguagePack: undefined,
      deviceInfo: dashboardProps.deviceInfo,
      deviceModelId: DeviceModelId.nanoX,
      deviceName: "Nano X",
      firmware: null,
      customImageBlocks: 0,
    };
    render(<Dashboard {...dashboardProps} result={result} />);
    expect(screen.getByTestId("device-dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("firmware-update")).toBeNull();
  });
});
