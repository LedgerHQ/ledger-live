import { act, renderHook } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { rnBleTransportIdentifier, rnHidTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import { type SavedDevice, useSaveDevice } from "./useSaveDevice";

const NOW = 1_700_000_000_000;

describe("useSaveDevice", () => {
  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should save the legacy device, with its legacy id, as the last connected device", () => {
    // GIVEN
    const savedDevice: SavedDevice = {
      lastConnectedDevice: {
        deviceId: "usb|device-id",
        deviceName: "Nano X",
        modelId: DeviceModelId.nanoX,
        wired: true,
      },
      knownDevice: {
        id: "device-id",
        name: "Ledger Nano X",
        deviceModelId: DeviceModelId.nanoX,
        transport: rnHidTransportIdentifier,
      },
    };
    const { result, store } = renderHook(() => useSaveDevice());

    // WHEN
    act(() => result.current(savedDevice));

    // THEN
    expect(store.getState().settings.lastConnectedDevice).toEqual(savedDevice.lastConnectedDevice);
    expect(store.getState().appstate.hasConnectedDevice).toBe(true);
    expect(store.getState().knownDevices.knownDevices).toEqual([
      { ...savedDevice.knownDevice, lastUsedAt: NOW },
    ]);
    expect(store.getState().ble.knownDevices).toEqual([]);
  });

  it("should update a BLE device that is already in the BLE known devices", () => {
    // GIVEN
    const { result, store } = renderHook(() => useSaveDevice(), {
      overrideInitialState: (state: State): State => ({
        ...state,
        ble: {
          ...state.ble,
          knownDevices: [{ id: "device-id", name: "Old name", modelId: DeviceModelId.nanoX }],
        },
      }),
    });

    // WHEN
    act(() =>
      result.current({
        lastConnectedDevice: {
          deviceId: "device-id",
          deviceName: "Ledger Nano X",
          modelId: DeviceModelId.nanoX,
          wired: false,
        },
        knownDevice: {
          id: "device-id",
          name: "Ledger Nano X",
          deviceModelId: DeviceModelId.nanoX,
          transport: rnBleTransportIdentifier,
        },
      }),
    );

    // THEN
    expect(store.getState().knownDevices.knownDevices).toEqual([
      {
        id: "device-id",
        name: "Ledger Nano X",
        deviceModelId: DeviceModelId.nanoX,
        transport: rnBleTransportIdentifier,
        lastUsedAt: NOW,
      },
    ]);
    expect(store.getState().ble.knownDevices).toEqual([
      { id: "device-id", name: "Ledger Nano X", modelId: DeviceModelId.nanoX },
    ]);
  });
});
