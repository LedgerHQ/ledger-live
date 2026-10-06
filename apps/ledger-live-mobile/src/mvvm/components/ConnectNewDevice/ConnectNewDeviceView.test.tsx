import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  BaseConnectionErrorTypes,
  BaseDiscoveryErrorTypes,
  ConnectNewDeviceUIStateTypes,
  rnBleTransportIdentifier,
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

function makeDiscoveringState(
  overrides: Partial<Extract<ConnectNewDeviceNonErrorUIState, { type: "discovering" }>> = {},
): ConnectNewDeviceNonErrorUIState {
  return {
    type: ConnectNewDeviceUIStateTypes.Discovering,
    devices: [{ device, onSelect: jest.fn() }],
    scanningTransports: [rnBleTransportIdentifier],
    showDeviceNotFound: false,
    ...overrides,
  };
}

function renderView(
  state: ConnectNewDeviceUIState,
  lastNonErrorState: ConnectNewDeviceNonErrorUIState = makeDiscoveringState(),
) {
  const onDeviceNotFound = jest.fn();
  const onCloseErrorSheet = jest.fn();

  const view = render(
    <ConnectNewDeviceView
      state={state}
      lastNonErrorState={lastNonErrorState}
      platform="android"
      onDeviceNotFound={onDeviceNotFound}
      onCloseErrorSheet={onCloseErrorSheet}
    />,
  );

  return { ...view, onDeviceNotFound, onCloseErrorSheet };
}

describe("ConnectNewDeviceView", () => {
  it("should list the discovered devices and select one on press", async () => {
    // GIVEN
    const onSelect = jest.fn();
    const { user } = renderView(makeDiscoveringState({ devices: [{ device, onSelect }] }));

    // WHEN
    await user.press(screen.getByText("Ledger Nano X"));

    // THEN
    expect(screen.getByText("Select your Ledger device")).toBeVisible();
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("should hide the device not found button until the state allows it", () => {
    renderView(makeDiscoveringState());

    expect(screen.queryByText("I don't see my device")).toBeNull();
  });

  it("should call onDeviceNotFound when the device not found button is pressed", async () => {
    // GIVEN
    const { user, onDeviceNotFound } = renderView(
      makeDiscoveringState({ showDeviceNotFound: true }),
    );

    // WHEN
    await user.press(screen.getByText("I don't see my device"));

    // THEN
    expect(onDeviceNotFound).toHaveBeenCalledTimes(1);
  });

  it("should show the device being paired while connecting", () => {
    renderView({ type: ConnectNewDeviceUIStateTypes.Connecting, device });

    expect(screen.getByText("Pairing with Ledger Nano X")).toBeVisible();
  });

  it.each([ConnectNewDeviceUIStateTypes.Connected, ConnectNewDeviceUIStateTypes.Done])(
    "should show the success view in the %s state",
    type => {
      renderView({ type });

      expect(screen.getByText("Your device is paired")).toBeVisible();
    },
  );

  it("should show a discovery error in the sheet over the last non-error view", () => {
    renderView({
      type: ConnectNewDeviceUIStateTypes.DiscoveryError,
      error: { type: BaseDiscoveryErrorTypes.Unknown },
      ignore: jest.fn(),
      close: jest.fn(),
    });

    expect(screen.getByText("Bluetooth scanning unsuccessful")).toBeVisible();
    expect(screen.getByText("Select your Ledger device")).toBeVisible();
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
