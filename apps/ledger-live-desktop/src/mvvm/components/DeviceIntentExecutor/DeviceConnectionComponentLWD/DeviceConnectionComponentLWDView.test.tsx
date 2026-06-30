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
  it("GIVEN connect device is loading WHEN rendering THEN it shows the loading state", () => {
    // WHEN
    renderView({ type: ConnectDeviceUIStateTypes.Loading });

    // THEN
    expect(screen.getByText("Loading")).toBeVisible();
  });

  it("GIVEN there is no known device WHEN clicking both CTAs THEN it renders the state and forwards callbacks", async () => {
    // GIVEN
    const onConnectLedgerDevice = jest.fn();
    const onBuyLedgerDevice = jest.fn();
    const { user } = renderView(
      { type: ConnectDeviceUIStateTypes.NoKnownDevice },
      { onConnectLedgerDevice, onBuyLedgerDevice },
    );

    // WHEN
    await user.click(screen.getByRole("button", { name: "Connect Ledger device" }));
    await user.click(screen.getByRole("button", { name: "I don't have a Ledger device" }));

    // THEN
    expect(screen.getByText("Ledger device required")).toBeVisible();
    expect(onConnectLedgerDevice).toHaveBeenCalledTimes(1);
    expect(onBuyLedgerDevice).toHaveBeenCalledTimes(1);
  });

  it("GIVEN known devices are listed WHEN rendering THEN it shows the discovering state", () => {
    // WHEN
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

    // THEN
    expect(screen.getByText("Select a device")).toBeVisible();
    expect(screen.getByText("My Ledger")).toBeVisible();
    expect(screen.getByText("Available")).toBeVisible();
  });

  it("GIVEN a selected device is not connected yet WHEN rendering THEN it shows the waiting state", () => {
    // WHEN
    renderView({
      type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice,
      device: makeKnownDevice(),
    });

    // THEN
    expect(screen.getByText("Power on and unlock your Ledger Nano X")).toBeVisible();
  });

  it("GIVEN WebHID discovery fails with an unknown error WHEN rendering THEN it shows the discovery error", () => {
    // WHEN
    renderView({
      type: ConnectDeviceUIStateTypes.DiscoveryError,
      error: { type: BaseDiscoveryErrorTypes.Unknown },
      retry: jest.fn(),
      ignore: jest.fn(),
    });

    // THEN
    expect(screen.getByText("Something went wrong")).toBeVisible();
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  it("GIVEN a non-desktop discovery error WHEN rendering THEN it renders nothing", () => {
    // WHEN
    const { container } = renderView({
      type: ConnectDeviceUIStateTypes.DiscoveryError,
      error: { type: "bluetooth-disabled-promptable" },
      ignore: jest.fn(),
    } as unknown as ConnectDeviceUIState);

    // THEN
    expect(container).toBeEmptyDOMElement();
  });

  it("GIVEN a device connection is in progress WHEN rendering THEN it shows the connecting state", () => {
    // WHEN
    renderView({ type: ConnectDeviceUIStateTypes.Connecting, device: makeKnownDevice() });

    // THEN
    expect(screen.getByText("Loading")).toBeVisible();
  });

  it("GIVEN WebHID connection fails with an unknown error WHEN rendering THEN it shows the connection error", () => {
    // WHEN
    renderView({
      type: ConnectDeviceUIStateTypes.ConnectionError,
      error: { type: BaseConnectionErrorTypes.Unknown },
      device: makeKnownDevice(),
      retry: jest.fn(),
      ignore: jest.fn(),
    });

    // THEN
    expect(screen.getByText("Pairing unsuccessful")).toBeVisible();
    expect(screen.getByText("Make sure your device is unlocked.")).toBeVisible();
  });

  it("GIVEN the device is connected WHEN rendering THEN it renders nothing", () => {
    // WHEN
    const { container } = renderView({ type: ConnectDeviceUIStateTypes.Connected });

    // THEN
    expect(container).toBeEmptyDOMElement();
  });

  it("GIVEN an unexpected error escapes WHEN rendering THEN it shows the generic unknown error state", () => {
    // WHEN
    renderView({ type: ConnectDeviceUIStateTypes.UnknownError, error: new Error("boom") });

    // THEN
    expect(screen.getByText("Unknown error")).toBeVisible();
  });
});
