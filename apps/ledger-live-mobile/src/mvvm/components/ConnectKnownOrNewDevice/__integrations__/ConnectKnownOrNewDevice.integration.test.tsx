import React from "react";
import { act, render, screen } from "@tests/test-renderer";
import { Text } from "react-native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceModelId as DMKDeviceModelId } from "@ledgerhq/device-management-kit";
import {
  connectKnownOrNewDevice,
  ConnectKnownOrNewDeviceUIStateTypes,
  ConnectNewDeviceUIStateTypes,
  DeviceListItemStatuses,
  DiscoveryErrorTypes,
  rnBleTransportIdentifier,
  useDeviceManagementKit,
  type ConnectKnownOrNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import type { DeviceConnectionResult } from "@ledgerhq/live-dmk-shared";
import { makeDiscoveryError } from "LLM/components/DeviceConnection/__fixtures__/discoveryError";
import { ConnectKnownOrNewDevice } from "..";

jest.mock("@ledgerhq/live-dmk-mobile", () => {
  const actual = jest.requireActual("@ledgerhq/live-dmk-mobile");

  return {
    ...actual,
    connectKnownOrNewDevice: jest.fn(),
    useDeviceManagementKit: jest.fn(),
  };
});

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => true,
}));

const mockedConnectKnownOrNewDevice = jest.mocked(connectKnownOrNewDevice);
const mockDmk = { id: "dmk" } as unknown as NonNullable<ReturnType<typeof useDeviceManagementKit>>;

let emitState: ((state: ConnectKnownOrNewDeviceUIState) => void) | undefined;

function emit(state: ConnectKnownOrNewDeviceUIState) {
  act(() => emitState?.(state));
}

function useCaseInput() {
  return mockedConnectKnownOrNewDevice.mock.calls[0][0];
}

const nanoX = {
  id: "nano-x-id",
  name: "My Nano X",
  deviceModelId: DeviceModelId.nanoX,
  transport: rnBleTransportIdentifier,
};

const nanoXRow = {
  key: "known:nano-x",
  device: nanoX,
  connectivity: "BLE" as const,
  status: DeviceListItemStatuses.Available,
};

const connectionResult: DeviceConnectionResult = {
  dmk: mockDmk,
  sessionId: "session-id",
  compatDeviceId: "nano-x-id",
  compatDeviceName: "My Nano X",
  compatDeviceWired: false,
  connectedDevice: {
    id: "nano-x-id",
    name: "My Nano X",
    modelId: DMKDeviceModelId.NANO_X,
    sessionId: "session-id",
    type: "BLE",
    transport: rnBleTransportIdentifier,
  } as DeviceConnectionResult["connectedDevice"],
};

function renderComponent() {
  const onConnected = jest.fn();
  const onAddModeChange = jest.fn();
  const view = render(
    <ConnectKnownOrNewDevice
      onConnected={onConnected}
      onAddModeChange={onAddModeChange}
      isPaused={false}
    >
      <Text>Explore all Ledger devices</Text>
    </ConnectKnownOrNewDevice>,
  );
  return { ...view, onAddModeChange, onConnected };
}

describe("ConnectKnownOrNewDevice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    emitState = undefined;
    jest.mocked(useDeviceManagementKit).mockReturnValue(mockDmk);
    mockedConnectKnownOrNewDevice.mockReturnValue({
      uiStates: {
        subscribe: jest.fn(({ next }) => {
          emitState = next;
          return { unsubscribe: jest.fn() };
        }),
      } as unknown as ReturnType<typeof connectKnownOrNewDevice>["uiStates"],
      pause: jest.fn(),
      resume: jest.fn(),
    });
  });

  it("should list the devices with the caller content under the list", () => {
    renderComponent();

    emit({
      type: ConnectKnownOrNewDeviceUIStateTypes.Discovering,
      devices: [{ ...nanoXRow, connect: jest.fn() }],
      addNewDevice: jest.fn(),
    });

    expect(screen.getByText("Devices")).toBeVisible();
    expect(screen.getByText("My Nano X")).toBeVisible();
    expect(screen.getByText("Explore all Ledger devices")).toBeVisible();
  });

  it("should connect the tapped device and forward the connection result", async () => {
    const connect = jest.fn();
    const { onConnected, user } = renderComponent();
    emit({
      type: ConnectKnownOrNewDeviceUIStateTypes.Discovering,
      devices: [{ ...nanoXRow, connect }],
      addNewDevice: jest.fn(),
    });

    await user.press(screen.getByText("My Nano X"));
    act(() => useCaseInput().onConnected(connectionResult, { isNewDevice: false }));

    expect(connect).toHaveBeenCalledTimes(1);
    expect(onConnected).toHaveBeenCalledWith(connectionResult, { isNewDevice: false });
  });

  it("should open the Add mode, show the pairing flow and close it", async () => {
    const addNewDevice = jest.fn();
    const close = jest.fn();
    const { onAddModeChange, user } = renderComponent();
    emit({
      type: ConnectKnownOrNewDeviceUIStateTypes.Discovering,
      devices: [],
      addNewDevice,
    });

    await user.press(screen.getByText("Add a Ledger device"));
    emit({
      type: ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice,
      connectNewDeviceUIState: {
        type: ConnectNewDeviceUIStateTypes.Discovering,
        devices: [],
        scanningTransports: [rnBleTransportIdentifier],
        showDeviceNotFound: false,
      },
      close,
    });

    expect(addNewDevice).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Looking for your Ledger devices")).toBeVisible();
    expect(screen.queryByText("Explore all Ledger devices")).toBeNull();
    expect(onAddModeChange).toHaveBeenCalledWith(true);

    await user.press(screen.getByTestId("connect-known-or-new-device-add-mode-close"));

    expect(close).toHaveBeenCalledTimes(1);
  });

  it("should show a discovery error over the list and retry it", async () => {
    const retry = jest.fn();
    const { user } = renderComponent();

    emit({
      type: ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError,
      devices: [nanoXRow],
      error: makeDiscoveryError(DiscoveryErrorTypes.BluetoothDisabledPromptable),
      retry,
      ignore: jest.fn(),
      close: jest.fn(),
    });

    expect(screen.getByText("Enable Bluetooth on your phone")).toBeVisible();
    expect(screen.getByText("My Nano X")).toBeVisible();

    await user.press(screen.getByText("Enable Bluetooth"));

    expect(retry).toHaveBeenCalledTimes(1);
  });
});
