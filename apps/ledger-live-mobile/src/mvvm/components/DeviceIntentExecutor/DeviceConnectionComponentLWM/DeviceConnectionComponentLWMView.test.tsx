import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import {
  ConnectionErrorTypes,
  ConnectDeviceUIStateTypes,
  DiscoveryErrorTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { getDeviceAnimation } from "~/helpers/getDeviceAnimation";
import { DeviceConnectionComponentLWMView } from "./DeviceConnectionComponentLWMView";
import type { DeviceConnectionComponentLWMViewModel } from "./useDeviceConnectionComponentLWMViewModel";

jest.mock("~/helpers/getDeviceAnimation", () => ({
  getDeviceAnimation: jest.fn(() => ({ w: 1, h: 1 })),
}));

const mockedGetDeviceAnimation = jest.mocked(getDeviceAnimation);
const animationSource = { w: 1, h: 1 } as ReturnType<typeof getDeviceAnimation>;

function makeKnownDevice(overrides: Partial<KnownDevice> = {}): KnownDevice {
  return {
    id: "device-id",
    name: "Ledger Nano X",
    deviceModelId: DeviceModelId.nanoX,
    transport: "ble" as KnownDevice["transport"],
    ...overrides,
  };
}

function renderView(
  state: ConnectDeviceUIState,
  callbacks: Partial<Omit<DeviceConnectionComponentLWMViewModel, "state">> = {},
) {
  return render(
    <DeviceConnectionComponentLWMView
      state={state}
      onConnectLedgerDevice={callbacks.onConnectLedgerDevice ?? jest.fn()}
      onBuyLedgerDevice={callbacks.onBuyLedgerDevice ?? jest.fn()}
    />,
  );
}

describe("DeviceConnectionComponentLWMView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetDeviceAnimation.mockReturnValue(animationSource);
  });

  it("should render the loading state", () => {
    renderView({ type: ConnectDeviceUIStateTypes.Loading });

    expect(screen.getByText("Loading")).toBeVisible();
  });

  it("should render the no known device state and forward its callbacks", async () => {
    const onConnectLedgerDevice = jest.fn();
    const onBuyLedgerDevice = jest.fn();
    const { user } = renderView(
      { type: ConnectDeviceUIStateTypes.NoKnownDevice },
      { onConnectLedgerDevice, onBuyLedgerDevice },
    );

    await user.press(screen.getByText("Connect Ledger device"));
    await user.press(screen.getByText("I don't have a Ledger device"));

    expect(screen.getByText("Ledger device required")).toBeVisible();
    expect(onConnectLedgerDevice).toHaveBeenCalledTimes(1);
    expect(onBuyLedgerDevice).toHaveBeenCalledTimes(1);
  });

  it("should render the discovering state", () => {
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
  });

  it("should render the waiting for selected device state", () => {
    renderView({
      type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice,
      device: makeKnownDevice(),
    });

    expect(screen.getByText("Power on and unlock your Ledger Nano X")).toBeVisible();
  });

  it("should render the discovery error state", () => {
    renderView({
      type: ConnectDeviceUIStateTypes.DiscoveryError,
      error: { type: DiscoveryErrorTypes.Unknown },
      ignore: jest.fn(),
    });

    expect(screen.getByText("Unable to discover devices")).toBeVisible();
  });

  it("should render the connecting state", () => {
    renderView({ type: ConnectDeviceUIStateTypes.Connecting });

    expect(screen.getByText("Loading")).toBeVisible();
  });

  it("should render the connection error state", () => {
    renderView({
      type: ConnectDeviceUIStateTypes.ConnectionError,
      error: { type: ConnectionErrorTypes.Unknown },
      retry: jest.fn(),
      ignore: jest.fn(),
    });

    expect(screen.getByText("Unable to connect")).toBeVisible();
  });

  it("should render nothing when connected", () => {
    const { toJSON } = renderView({ type: ConnectDeviceUIStateTypes.Connected });

    expect(toJSON()).toBeNull();
  });

  it("should throw when the state is not handled", () => {
    expect(() =>
      renderView({ type: "unsupported" } as unknown as ConnectDeviceUIState),
    ).toThrow('Unhandled connect device state: {"type":"unsupported"}');
  });
});
