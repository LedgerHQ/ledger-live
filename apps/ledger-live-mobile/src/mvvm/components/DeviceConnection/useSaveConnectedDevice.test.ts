import { act, renderHook } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  DeviceModelId as DMKDeviceModelId,
  type ConnectedDevice,
} from "@ledgerhq/device-management-kit";
import { useSaveConnectedDevice } from "./useSaveConnectedDevice";

function makeConnectedDevice(overrides: Partial<ConnectedDevice> = {}): ConnectedDevice {
  return {
    id: "device-id",
    name: "Ledger Nano X",
    modelId: DMKDeviceModelId.NANO_X,
    sessionId: "session-id",
    type: "BLE",
    transport: "ble",
    ...overrides,
  } as ConnectedDevice;
}

describe("useSaveConnectedDevice", () => {
  it("should save a wired device as the last connected device and a known device", () => {
    // GIVEN
    const { result, store } = renderHook(() => useSaveConnectedDevice());

    // WHEN
    act(() => result.current(makeConnectedDevice({ type: "USB", transport: "hid" })));

    // THEN
    expect(store.getState().settings.lastConnectedDevice).toEqual({
      deviceId: "device-id",
      deviceName: "Ledger Nano X",
      modelId: DeviceModelId.nanoX,
      wired: true,
    });
    expect(store.getState().appstate.hasConnectedDevice).toBe(true);
    expect(store.getState().knownDevices.knownDevices).toEqual([
      {
        id: "device-id",
        name: "Ledger Nano X",
        deviceModelId: DeviceModelId.nanoX,
        transport: "hid",
      },
    ]);
    expect(store.getState().ble.knownDevices).toEqual([]);
  });

  it("should not add an unknown BLE device to the BLE known devices", () => {
    // GIVEN
    const { result, store } = renderHook(() => useSaveConnectedDevice());

    // WHEN
    act(() => result.current(makeConnectedDevice()));

    // THEN
    expect(store.getState().ble.knownDevices).toEqual([]);
  });

  it("should add a new BLE device to the BLE known devices", () => {
    // GIVEN
    const { result, store } = renderHook(() => useSaveConnectedDevice({ isNewDevice: true }));

    // WHEN
    act(() => result.current(makeConnectedDevice()));

    // THEN
    expect(store.getState().ble.knownDevices).toEqual([
      { id: "device-id", name: "Ledger Nano X", modelId: DeviceModelId.nanoX },
    ]);
  });

  it("should not add a new wired device to the BLE known devices", () => {
    // GIVEN
    const { result, store } = renderHook(() => useSaveConnectedDevice({ isNewDevice: true }));

    // WHEN
    act(() => result.current(makeConnectedDevice({ type: "USB", transport: "hid" })));

    // THEN
    expect(store.getState().ble.knownDevices).toEqual([]);
  });

  it("should update a BLE device that is already in the BLE known devices", () => {
    // GIVEN
    const { result, store } = renderHook(() => useSaveConnectedDevice(), {
      overrideInitialState: (state: State): State => ({
        ...state,
        ble: {
          ...state.ble,
          knownDevices: [{ id: "device-id", name: "Old name", modelId: DeviceModelId.nanoX }],
        },
      }),
    });

    // WHEN
    act(() => result.current(makeConnectedDevice()));

    // THEN
    expect(store.getState().settings.lastConnectedDevice).toEqual({
      deviceId: "device-id",
      deviceName: "Ledger Nano X",
      modelId: DeviceModelId.nanoX,
      wired: false,
    });
    expect(store.getState().knownDevices.knownDevices).toEqual([
      {
        id: "device-id",
        name: "Ledger Nano X",
        deviceModelId: DeviceModelId.nanoX,
        transport: "ble",
      },
    ]);
    expect(store.getState().ble.knownDevices).toEqual([
      {
        id: "device-id",
        name: "Ledger Nano X",
        modelId: DeviceModelId.nanoX,
      },
    ]);
  });
});
