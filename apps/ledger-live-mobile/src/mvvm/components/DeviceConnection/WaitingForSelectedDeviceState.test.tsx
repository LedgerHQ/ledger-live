import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { getDeviceModel } from "@ledgerhq/devices";
import { rnBleTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import type { Device } from "@ledgerhq/live-dmk-shared";
import { WaitingForSelectedDeviceState } from "./WaitingForSelectedDeviceState";

function makeDevice(overrides: Partial<Device> = {}): Device {
  return {
    id: "device-id",
    name: "Ledger Nano X",
    deviceModelId: DeviceModelId.nanoX,
    transport: rnBleTransportIdentifier,
    ...overrides,
  };
}

describe("WaitingForSelectedDeviceState", () => {
  it("should render the device name and product-specific title", () => {
    render(<WaitingForSelectedDeviceState device={makeDevice({ name: "My Ledger" })} />);

    expect(screen.getByText("My Ledger")).toBeVisible();
    expect(
      screen.getByText(
        `Power on and unlock your ${getDeviceModel(DeviceModelId.nanoX).productName}`,
      ),
    ).toBeVisible();
  });

  it("should render the fallback device name when the device has no name", () => {
    render(<WaitingForSelectedDeviceState device={makeDevice({ name: null })} />);

    expect(screen.getByText("Ledger device")).toBeVisible();
  });
});
