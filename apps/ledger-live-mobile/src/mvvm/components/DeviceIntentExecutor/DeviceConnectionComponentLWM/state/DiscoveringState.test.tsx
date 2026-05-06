import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import {
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
  type DisplayedDevice,
} from "@ledgerhq/live-dmk-mobile";
import { DiscoveringState } from "./DiscoveringState";

type DiscoveringUIState = Extract<
  ConnectDeviceUIState,
  { type: ConnectDeviceUIStateTypes.Discovering }
>;

function makeKnownDevice(overrides: Partial<KnownDevice>): KnownDevice {
  return {
    id: "device-id",
    name: "Ledger Nano X",
    deviceModelId: DeviceModelId.nanoX,
    transport: "ble" as KnownDevice["transport"],
    ...overrides,
  };
}

function makeDisplayedDevice(overrides: Partial<DisplayedDevice>): DisplayedDevice {
  return {
    type: "available",
    knownDevice: makeKnownDevice({}),
    onSelect: jest.fn(),
    ...overrides,
  } as DisplayedDevice;
}

function renderState(devices: DisplayedDevice[]) {
  const state: DiscoveringUIState = {
    type: ConnectDeviceUIStateTypes.Discovering,
    devices,
  };

  return render(<DiscoveringState state={state} />);
}

describe("DiscoveringState", () => {
  it("should render the discovering title", () => {
    renderState([]);

    expect(screen.getByText("Select a device")).toBeVisible();
  });

  it("should render available and unavailable devices with their status", () => {
    const availableDevice = makeDisplayedDevice({
      type: "available",
      knownDevice: makeKnownDevice({ id: "available-device", name: "Available Ledger" }),
    });
    const unavailableDevice = makeDisplayedDevice({
      type: "not-available",
      knownDevice: makeKnownDevice({ id: "unavailable-device", name: "Unavailable Ledger" }),
    });

    renderState([availableDevice, unavailableDevice]);

    expect(screen.getByText("Available Ledger")).toBeVisible();
    expect(screen.getByText("Available")).toBeVisible();
    expect(screen.getByText("Unavailable Ledger")).toBeVisible();
    expect(screen.getByText("Not connected")).toBeVisible();
  });

  it("should render the fallback device name when a known device has no name", () => {
    const device = makeDisplayedDevice({
      knownDevice: makeKnownDevice({ id: "unnamed-device", name: null }),
    });

    renderState([device]);

    expect(screen.getByText("Ledger device")).toBeVisible();
  });

  it("should call the selected device callback when a device is pressed", async () => {
    const onSelect = jest.fn();
    const device = makeDisplayedDevice({
      knownDevice: makeKnownDevice({ id: "available-device", name: "Available Ledger" }),
      onSelect,
    });
    const { user } = renderState([device]);

    await user.press(screen.getByText("Available Ledger"));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
