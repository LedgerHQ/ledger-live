import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import type { DisplayedDevice } from "@ledgerhq/live-dmk-mobile";
import { DeviceListItem } from "./DeviceListItem";

function makeKnownDevice(overrides: Partial<KnownDevice> = {}): KnownDevice {
  return {
    id: "device-id",
    name: "Ledger Nano X",
    deviceModelId: DeviceModelId.nanoX,
    transport: "ble" as KnownDevice["transport"],
    ...overrides,
  };
}

function makeDisplayedDevice(overrides: Partial<DisplayedDevice> = {}): DisplayedDevice {
  return {
    type: "available",
    knownDevice: makeKnownDevice(),
    onSelect: jest.fn(),
    ...overrides,
  } as DisplayedDevice;
}

describe("DeviceListItem", () => {
  it("should render an available device with its status", () => {
    const device = makeDisplayedDevice({
      type: "available",
      knownDevice: makeKnownDevice({ name: "Available Ledger" }),
    });

    render(<DeviceListItem device={device} />);

    expect(screen.getByText("Available Ledger")).toBeVisible();
    expect(screen.getByText("Available")).toBeVisible();
  });

  it("should render an unavailable device with its status", () => {
    const device = makeDisplayedDevice({
      type: "not-available",
      knownDevice: makeKnownDevice({ name: "Unavailable Ledger" }),
    });

    render(<DeviceListItem device={device} />);

    expect(screen.getByText("Unavailable Ledger")).toBeVisible();
    expect(screen.getByText("Not connected")).toBeVisible();
  });

  it("should render the fallback device name when a known device has no name", () => {
    const device = makeDisplayedDevice({
      knownDevice: makeKnownDevice({ name: null }),
    });

    render(<DeviceListItem device={device} />);

    expect(screen.getByText("Ledger device")).toBeVisible();
  });

  it("should call the selected device callback when a device is pressed", async () => {
    const onSelect = jest.fn();
    const device = makeDisplayedDevice({
      knownDevice: makeKnownDevice({ name: "Available Ledger" }),
      onSelect,
    });
    const { user } = render(<DeviceListItem device={device} />);

    await user.press(screen.getByText("Available Ledger"));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
