import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import type { DisplayedDevice } from "@ledgerhq/live-dmk-mobile";
import { track } from "~/analytics";
import { previousRouteNameRef } from "~/analytics/screenRefs";
import { SourceFlowProvider } from "../../utils/SourceFlowContext";
import { DeviceListItem } from "./DeviceListItem";

jest.mock("~/analytics", () => {
  const actual = jest.requireActual("~/analytics");
  return {
    ...actual,
    track: jest.fn(),
  };
});

const mockedTrack = jest.mocked(track);
const TEST_SOURCE = "Connect Device - Discovering";

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
  beforeEach(() => {
    jest.clearAllMocks();
    previousRouteNameRef.current = TEST_SOURCE;
  });

  function renderDeviceListItem(device: DisplayedDevice) {
    return render(
      <SourceFlowProvider value="my_ledger">
        <DeviceListItem device={device} />
      </SourceFlowProvider>,
    );
  }

  it("should render an available device with its status", () => {
    const device = makeDisplayedDevice({
      type: "available",
      knownDevice: makeKnownDevice({ name: "Available Ledger" }),
    });

    renderDeviceListItem(device);

    expect(screen.getByText("Available Ledger")).toBeVisible();
    expect(screen.getByText("Available")).toBeVisible();
  });

  it("should render an unavailable device with its status", () => {
    const device = makeDisplayedDevice({
      type: "not-available",
      knownDevice: makeKnownDevice({ name: "Unavailable Ledger" }),
    });

    renderDeviceListItem(device);

    expect(screen.getByText("Unavailable Ledger")).toBeVisible();
    expect(screen.getByText("Not connected")).toBeVisible();
  });

  it("should render the fallback device name when a known device has no name", () => {
    const device = makeDisplayedDevice({
      knownDevice: makeKnownDevice({ name: null }),
    });

    renderDeviceListItem(device);

    expect(screen.getByText("Ledger device")).toBeVisible();
  });

  it("should call the selected device callback when a device is pressed", async () => {
    const onSelect = jest.fn();
    const device = makeDisplayedDevice({
      knownDevice: makeKnownDevice({ name: "Available Ledger" }),
      onSelect,
    });
    const { user } = renderDeviceListItem(device);

    await user.press(screen.getByText("Available Ledger"));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("GIVEN a device row WHEN it is pressed THEN it tracks device_selected", async () => {
    // GIVEN
    const onSelect = jest.fn();
    const device = makeDisplayedDevice({
      knownDevice: makeKnownDevice({
        name: "Ledger Stax",
        deviceModelId: DeviceModelId.stax,
      }),
      onSelect,
    });
    const { user } = renderDeviceListItem(device);

    // WHEN
    await user.press(screen.getByText("Ledger Stax"));

    // THEN
    expect(mockedTrack).toHaveBeenCalledWith("device_selected", {
      sourceFlow: "my_ledger",
      source: TEST_SOURCE,
      deviceUxV2: true,
      modelId: DeviceModelId.stax,
      transport: "ble",
    });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
