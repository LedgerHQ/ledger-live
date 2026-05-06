import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { getDeviceModel } from "@ledgerhq/devices";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import {
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { WaitingForSelectedDeviceState } from "./WaitingForSelectedDeviceState";

type WaitingForSelectedDeviceUIState = Extract<
  ConnectDeviceUIState,
  { type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice }
>;

function makeKnownDevice(overrides: Partial<KnownDevice> = {}): KnownDevice {
  return {
    id: "device-id",
    name: "Ledger Nano X",
    deviceModelId: DeviceModelId.nanoX,
    transport: "ble" as KnownDevice["transport"],
    ...overrides,
  };
}

function renderState(device: KnownDevice) {
  const state: WaitingForSelectedDeviceUIState = {
    type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice,
    device,
  };

  return render(<WaitingForSelectedDeviceState state={state} />);
}

describe("WaitingForSelectedDeviceState", () => {
  it("should render the selected device name and product-specific title", () => {
    renderState(makeKnownDevice({ name: "My Ledger" }));

    expect(screen.getByText("My Ledger")).toBeVisible();
    expect(
      screen.getByText(
        `Power on and unlock your ${getDeviceModel(DeviceModelId.nanoX).productName}`,
      ),
    ).toBeVisible();
  });

  it("should render the fallback device name when the selected device has no name", () => {
    renderState(makeKnownDevice({ name: null }));

    expect(screen.getByText("Ledger device")).toBeVisible();
  });
});
