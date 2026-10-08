import React from "react";
import { act, render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceModelId as DMKDeviceModelId } from "@ledgerhq/device-management-kit";
import {
  connectNewDevice,
  ConnectNewDeviceUIStateTypes,
  rnBleTransportIdentifier,
  rnHidTransportIdentifier,
  useDeviceManagementKit,
  type ConnectNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import type { DeviceConnectionResult } from "@ledgerhq/live-dmk-shared";
import { ConnectNewDevice } from "..";

jest.mock("@ledgerhq/live-dmk-mobile", () => {
  const actual = jest.requireActual("@ledgerhq/live-dmk-mobile");

  return {
    ...actual,
    connectNewDevice: jest.fn(),
    useDeviceManagementKit: jest.fn(),
  };
});

const mockedConnectNewDevice = jest.mocked(connectNewDevice);
const mockDmk = { id: "dmk" } as unknown as NonNullable<ReturnType<typeof useDeviceManagementKit>>;

let emitState: ((state: ConnectNewDeviceUIState) => void) | undefined;

function emit(state: ConnectNewDeviceUIState) {
  act(() => emitState?.(state));
}

function useCaseInput() {
  return mockedConnectNewDevice.mock.calls[0][0];
}

function makeDevice(transport: string) {
  return { id: "device-id", name: "Ledger Nano X", deviceModelId: DeviceModelId.nanoX, transport };
}

function makeConnectionResult(transport: string): DeviceConnectionResult {
  const wired = transport === rnHidTransportIdentifier;

  return {
    dmk: mockDmk,
    sessionId: "session-id",
    compatDeviceId: "device-id",
    compatDeviceName: "Ledger Nano X",
    compatDeviceWired: wired,
    connectedDevice: {
      id: "device-id",
      name: "Ledger Nano X",
      modelId: DMKDeviceModelId.NANO_X,
      sessionId: "session-id",
      type: wired ? "USB" : "BLE",
      transport,
    } as DeviceConnectionResult["connectedDevice"],
  };
}

describe("ConnectNewDevice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    emitState = undefined;
    jest.mocked(useDeviceManagementKit).mockReturnValue(mockDmk);
    mockedConnectNewDevice.mockReturnValue({
      subscribe: jest.fn(({ next }) => {
        emitState = next;
        return { unsubscribe: jest.fn() };
      }),
    } as unknown as ReturnType<typeof connectNewDevice>);
  });

  it.each([
    { name: "Bluetooth", transport: rnBleTransportIdentifier, title: "Your device is paired" },
    { name: "USB", transport: rnHidTransportIdentifier, title: "Your device is connected" },
  ])(
    "should show $title for a $name device, then forward the connection result",
    ({ transport, title }) => {
      // GIVEN
      const onConnected = jest.fn();
      const device = makeDevice(transport);
      const connectionResult = makeConnectionResult(transport);
      render(<ConnectNewDevice onConnected={onConnected} onClose={jest.fn()} />);

      // WHEN
      emit({ type: ConnectNewDeviceUIStateTypes.Connected, device });

      // THEN
      expect(screen.getByText(title)).toBeVisible();

      // WHEN
      emit({ type: ConnectNewDeviceUIStateTypes.Done, device });
      act(() => useCaseInput().onConnected(connectionResult));

      // THEN
      expect(screen.getByText(title)).toBeVisible();
      expect(onConnected).toHaveBeenCalledWith(connectionResult);
    },
  );
});
