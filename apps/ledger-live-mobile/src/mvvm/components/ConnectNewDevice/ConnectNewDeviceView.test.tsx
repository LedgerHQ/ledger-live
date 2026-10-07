import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  BaseConnectionErrorTypes,
  BaseDiscoveryErrorTypes,
  ConnectNewDeviceUIStateTypes,
  rnBleTransportIdentifier,
  rnHidTransportIdentifier,
  type ConnectNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { ConnectNewDeviceView } from "./ConnectNewDeviceView";
import type { ConnectNewDeviceNonErrorUIState } from "./types";

const device = {
  id: "device-id",
  name: "Ledger Nano X",
  deviceModelId: DeviceModelId.nanoX,
  transport: rnBleTransportIdentifier,
};
const usbDevice = { ...device, transport: rnHidTransportIdentifier };

function makeDiscoveringState(
  overrides: Partial<Extract<ConnectNewDeviceNonErrorUIState, { type: "discovering" }>> = {},
): ConnectNewDeviceNonErrorUIState {
  return {
    type: ConnectNewDeviceUIStateTypes.Discovering,
    devices: [{ device, isAvailable: true, onSelect: jest.fn() }],
    scanningTransports: [rnBleTransportIdentifier],
    showDeviceNotFound: false,
    ...overrides,
  };
}

function renderView(
  state: ConnectNewDeviceUIState,
  lastNonErrorState: ConnectNewDeviceNonErrorUIState = makeDiscoveringState(),
  { withDeviceNotFound = true }: { withDeviceNotFound?: boolean } = {},
) {
  const onDeviceNotFound = jest.fn();
  const onCloseErrorSheet = jest.fn();

  const view = render(
    <ConnectNewDeviceView
      state={state}
      lastNonErrorState={lastNonErrorState}
      platform="android"
      onDeviceNotFound={withDeviceNotFound ? onDeviceNotFound : undefined}
      onCloseErrorSheet={onCloseErrorSheet}
    />,
  );

  return { ...view, onDeviceNotFound, onCloseErrorSheet };
}

describe("ConnectNewDeviceView", () => {
  it("should list the discovered devices and select one when its Connect button is pressed", async () => {
    // GIVEN
    const onSelect = jest.fn();
    const { user } = renderView(
      makeDiscoveringState({ devices: [{ device, isAvailable: true, onSelect }] }),
    );

    // WHEN
    await user.press(screen.getByText("Connect"));

    // THEN
    expect(screen.getByText("Looking for your Ledger devices")).toBeVisible();
    expect(screen.getByText("Ledger Nano X")).toBeVisible();
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      transports: [rnBleTransportIdentifier],
      mode: "bluetooth",
      description:
        "Make sure your Ledger device is unlocked and close to the mobile phone you want to pair with.",
    },
    {
      transports: [rnBleTransportIdentifier, rnHidTransportIdentifier],
      mode: "bluetoothAndUsb",
      description:
        "Unlock your Ledger and connect it to your phone using Bluetooth or a USB cable.",
    },
    {
      transports: [rnHidTransportIdentifier],
      mode: "usb",
      description: "Unlock your Ledger and connect it to your phone using a USB cable.",
    },
  ])(
    "should show the $mode copy and animation when scanning $transports",
    ({ transports, mode, description }) => {
      renderView(makeDiscoveringState({ scanningTransports: transports }));

      expect(screen.getByText(description)).toBeVisible();
      expect(screen.getByTestId(`connect-new-device-discovering-${mode}`)).toBeVisible();
    },
  );

  it("should hide the device not found button until the state allows it", () => {
    renderView(makeDiscoveringState());

    expect(screen.queryByText("I don’t see my device")).toBeNull();
  });

  it("should not show the device not found button when the caller gives no onDeviceNotFound", () => {
    const discoveringState = makeDiscoveringState({ showDeviceNotFound: true });

    renderView(discoveringState, discoveringState, { withDeviceNotFound: false });

    expect(screen.queryByText("I don’t see my device")).toBeNull();
  });

  it("should call onDeviceNotFound when the device not found button is pressed", async () => {
    // GIVEN
    const { user, onDeviceNotFound } = renderView(
      makeDiscoveringState({ showDeviceNotFound: true }),
    );

    // WHEN
    await user.press(screen.getByText("I don’t see my device"));

    // THEN
    expect(onDeviceNotFound).toHaveBeenCalledTimes(1);
  });

  it("should show the device being paired and the code hint while connecting over Bluetooth", () => {
    renderView({ type: ConnectNewDeviceUIStateTypes.Connecting, device });

    expect(screen.getByText("Pairing with Ledger Nano X")).toBeVisible();
    expect(screen.getByText("If prompted, confirm the code on your Ledger Nano X.")).toBeVisible();
  });

  it("should say connecting, without the code hint, while connecting over USB", () => {
    renderView({ type: ConnectNewDeviceUIStateTypes.Connecting, device: usbDevice });

    expect(screen.getByText("Connecting to Ledger Nano X")).toBeVisible();
    expect(screen.queryByText(/confirm the code/)).toBeNull();
  });

  it.each([
    { type: ConnectNewDeviceUIStateTypes.Connected, device, title: "Your device is paired" },
    { type: ConnectNewDeviceUIStateTypes.Done, device, title: "Your device is paired" },
    {
      type: ConnectNewDeviceUIStateTypes.Connected,
      device: usbDevice,
      title: "Your device is connected",
    },
    {
      type: ConnectNewDeviceUIStateTypes.Done,
      device: usbDevice,
      title: "Your device is connected",
    },
  ])(
    "should show $title in the $type state for a $device.transport device",
    ({ type, device: connectedDevice, title }) => {
      renderView({ type, device: connectedDevice });

      expect(screen.getByText(title)).toBeVisible();
    },
  );

  it("should keep listing a device that is no longer discovered, with its select button disabled", () => {
    renderView(makeDiscoveringState({ devices: [{ device, isAvailable: false }] }));

    expect(screen.getByText("Ledger Nano X")).toBeVisible();
    expect(screen.getByLabelText("Connect Ledger Nano X")).toBeDisabled();
  });

  it("should name the device in each select button for screen readers", () => {
    const stax = { ...usbDevice, id: "stax-id", name: "Ledger Stax" };

    renderView(
      makeDiscoveringState({
        devices: [
          { device, isAvailable: true, onSelect: jest.fn() },
          { device: stax, isAvailable: true, onSelect: jest.fn() },
        ],
      }),
    );

    expect(screen.getByLabelText("Connect Ledger Nano X")).toBeVisible();
    expect(screen.getByLabelText("Connect Ledger Stax")).toBeVisible();
  });

  it("should show a discovery error in the sheet over the last non-error view", () => {
    renderView({
      type: ConnectNewDeviceUIStateTypes.DiscoveryError,
      error: { type: BaseDiscoveryErrorTypes.Unknown },
      ignore: jest.fn(),
      close: jest.fn(),
    });

    expect(screen.getByText("Bluetooth scanning unsuccessful")).toBeVisible();
    expect(screen.getByText("Looking for your Ledger devices")).toBeVisible();
  });

  it("should show a connection error in the sheet over the last non-error view", () => {
    renderView(
      {
        type: ConnectNewDeviceUIStateTypes.ConnectionError,
        error: { type: BaseConnectionErrorTypes.Unknown },
        device,
        retry: jest.fn(),
        ignore: jest.fn(),
        close: jest.fn(),
      },
      { type: ConnectNewDeviceUIStateTypes.Connecting, device },
    );

    expect(screen.getByText("Pairing unsuccessful")).toBeVisible();
    expect(screen.getByText("Pairing with Ledger Nano X")).toBeVisible();
  });

  it("should show the unknown error in the sheet", () => {
    renderView({ type: ConnectNewDeviceUIStateTypes.UnknownError, error: new Error("boom") });

    expect(screen.getByText("Unknown error")).toBeVisible();
  });

  it("should call onCloseErrorSheet when the user closes the error sheet", async () => {
    // GIVEN
    const { user, onCloseErrorSheet } = renderView({
      type: ConnectNewDeviceUIStateTypes.UnknownError,
      error: new Error("boom"),
    });

    // WHEN
    await user.press(screen.getByRole("button", { name: "Close" }));

    // THEN
    expect(onCloseErrorSheet).toHaveBeenCalledTimes(1);
  });
});
