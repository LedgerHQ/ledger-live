import React from "react";
import {
  BaseConnectionErrorTypes,
  BaseDiscoveryErrorTypes,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-desktop";
import { screen } from "@testing-library/react";

import { DeviceConnectionComponentLWDView } from "./DeviceConnectionComponentLWDView";
import { makeKnownDevice, renderWithUser } from "./testUtils";
import type { DeviceConnectionComponentLWDViewModel } from "./useDeviceConnectionComponentLWDViewModel";

jest.mock("~/renderer/components/DeviceAction/animations", () => ({
  getDeviceAnimation: jest.fn(() => undefined),
}));

jest.mock("~/renderer/hooks/useTheme", () => () => ({ theme: "dark" }));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const { mockT } = jest.requireActual("./testUtils");
      return mockT(key, params);
    },
  }),
}));

function renderView(
  state: ConnectDeviceUIState,
  callbacks: Partial<Omit<DeviceConnectionComponentLWDViewModel, "state">> = {},
) {
  return renderWithUser(
    <DeviceConnectionComponentLWDView
      state={state}
      onConnectLedgerDevice={callbacks.onConnectLedgerDevice ?? jest.fn()}
      onBuyLedgerDevice={callbacks.onBuyLedgerDevice ?? jest.fn()}
    />,
  );
}

describe("DeviceConnectionComponentLWDView", () => {
  it("should render the loading state when connect device is loading", () => {
    renderView({ type: ConnectDeviceUIStateTypes.Loading });

    expect(screen.getByText("Loading")).toBeVisible();
  });

  it("should render the no known device state and forward its callbacks when CTAs are clicked", async () => {
    const onConnectLedgerDevice = jest.fn();
    const onBuyLedgerDevice = jest.fn();
    const { user } = renderView(
      { type: ConnectDeviceUIStateTypes.NoKnownDevice },
      { onConnectLedgerDevice, onBuyLedgerDevice },
    );

    await user.click(screen.getByRole("button", { name: "Connect Ledger device" }));
    await user.click(screen.getByRole("button", { name: "I don't have a Ledger device" }));

    expect(screen.getByText("Ledger device required")).toBeVisible();
    expect(onConnectLedgerDevice).toHaveBeenCalledTimes(1);
    expect(onBuyLedgerDevice).toHaveBeenCalledTimes(1);
  });

  it("should render the discovering state when known devices are listed", () => {
    renderView({
      type: ConnectDeviceUIStateTypes.Discovering,
      devices: [
        {
          type: "available",
          knownDevice: makeKnownDevice({ name: "My Ledger" }),
          onSelect: jest.fn(),
        },
      ],
    });

    expect(screen.getByText("Select a device")).toBeVisible();
    expect(screen.getByText("My Ledger")).toBeVisible();
    expect(screen.getByText("Available")).toBeVisible();
  });

  it("should render the waiting state when a selected device is not connected yet", () => {
    renderView({
      type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice,
      device: makeKnownDevice(),
    });

    expect(screen.getByText("Power on and unlock your Ledger Nano X")).toBeVisible();
  });

  it("should render an unknown discovery error when WebHID discovery fails", () => {
    renderView({
      type: ConnectDeviceUIStateTypes.DiscoveryError,
      error: { type: BaseDiscoveryErrorTypes.Unknown },
      retry: jest.fn(),
      ignore: jest.fn(),
    });

    expect(screen.getByText("Something went wrong")).toBeVisible();
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  it("should render nothing when a non-desktop discovery error is received", () => {
    const { container } = renderView({
      type: ConnectDeviceUIStateTypes.DiscoveryError,
      error: { type: "bluetooth-disabled-promptable" },
      ignore: jest.fn(),
    } as unknown as ConnectDeviceUIState);

    expect(container).toBeEmptyDOMElement();
  });

  it("should render the connecting state when a device connection is in progress", () => {
    renderView({ type: ConnectDeviceUIStateTypes.Connecting, device: makeKnownDevice() });

    expect(screen.getByText("Loading")).toBeVisible();
  });

  it("should render an unknown connection error when WebHID connection fails", () => {
    renderView({
      type: ConnectDeviceUIStateTypes.ConnectionError,
      error: { type: BaseConnectionErrorTypes.Unknown },
      device: makeKnownDevice(),
      retry: jest.fn(),
      ignore: jest.fn(),
    });

    expect(screen.getByText("Pairing unsuccessful")).toBeVisible();
    expect(screen.getByText("Make sure your device is unlocked.")).toBeVisible();
  });

  it("should render nothing when the device is connected", () => {
    const { container } = renderView({ type: ConnectDeviceUIStateTypes.Connected });

    expect(container).toBeEmptyDOMElement();
  });

  it("should render the generic unknown error state when an unexpected error escapes", () => {
    renderView({ type: ConnectDeviceUIStateTypes.UnknownError, error: new Error("boom") });

    expect(screen.getByText("Unknown error")).toBeVisible();
  });
});
