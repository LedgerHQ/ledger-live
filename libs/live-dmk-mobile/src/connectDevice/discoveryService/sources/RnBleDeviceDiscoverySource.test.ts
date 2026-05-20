import type { DeviceManagementKit, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import {
  BlePoweredOff,
  rnBleTransportIdentifier,
} from "@ledgerhq/device-transport-kit-react-native-ble";
import { BleError, BleErrorCode } from "react-native-ble-plx";
import { firstValueFrom, of, throwError } from "rxjs";
import { DiscoveryErrorTypes, type DiscoveryError } from "../../types";
import type { DiscoveryPreflightChecks } from "../preflight/preflightResult";
import { RnBleDeviceDiscoverySource } from "./RnBleDeviceDiscoverySource";

jest.mock("../preflight/DefaultBleDiscoveryPreflightChecks", () => ({
  DefaultBleDiscoveryPreflightChecks: jest.fn().mockImplementation(() => ({
    getPreflight: jest.fn().mockResolvedValue({ success: true }),
  })),
}));

const createMockDMK = (listenToAvailableDevices: jest.Mock): DeviceManagementKit =>
  ({ listenToAvailableDevices }) as unknown as DeviceManagementKit;

const createPreflightChecks = (
  getPreflight: DiscoveryPreflightChecks["getPreflight"],
): DiscoveryPreflightChecks => ({
  getPreflight,
});

const createDiscoveredDevice = (id: string): DiscoveredDevice =>
  ({
    id,
    name: id,
    deviceModel: { id: "model", model: "model", name: "model" },
    transport: rnBleTransportIdentifier,
  }) as unknown as DiscoveredDevice;

const discoveryError: DiscoveryError = {
  type: DiscoveryErrorTypes.BluetoothUnsupported,
  transportId: rnBleTransportIdentifier,
  resolution: { type: "none" },
};

describe("RnBleDeviceDiscoverySource", () => {
  it("GIVEN a BLE discovery source, WHEN reading its transport id, THEN it should expose the RN BLE transport identifier", () => {
    // GIVEN
    const source = new RnBleDeviceDiscoverySource(createMockDMK(jest.fn()));

    // WHEN
    const transportId = source.transportId;

    // THEN
    expect(transportId).toBe(rnBleTransportIdentifier);
  });

  it("GIVEN preflight fails, WHEN listening, THEN it should emit the preflight error without starting BLE discovery", async () => {
    // GIVEN
    const listenToAvailableDevices = jest.fn();
    const source = new RnBleDeviceDiscoverySource(
      createMockDMK(listenToAvailableDevices),
      createPreflightChecks(async () => ({ success: false, discoveryError })),
    );

    // WHEN
    const event = firstValueFrom(source.listen());

    // THEN
    await expect(event).resolves.toEqual({
      type: "error",
      error: discoveryError,
    });
    expect(listenToAvailableDevices).not.toHaveBeenCalled();
  });

  it("GIVEN preflight succeeds, WHEN BLE discovery emits devices, THEN it should emit discovered devices", async () => {
    // GIVEN
    const devices = [createDiscoveredDevice("ble-1")];
    const listenToAvailableDevices = jest.fn().mockReturnValue(of(devices));
    const source = new RnBleDeviceDiscoverySource(
      createMockDMK(listenToAvailableDevices),
      createPreflightChecks(async () => ({ success: true })),
    );

    // WHEN
    const event = firstValueFrom(source.listen());

    // THEN
    await expect(event).resolves.toEqual({
      type: "devices",
      devices,
    });
    expect(listenToAvailableDevices).toHaveBeenCalledWith({ transport: rnBleTransportIdentifier });
  });

  it("GIVEN preflight throws, WHEN listening, THEN it should emit an unknown discovery error", async () => {
    // GIVEN
    const error = new Error("preflight failure");
    const source = new RnBleDeviceDiscoverySource(
      createMockDMK(jest.fn()),
      createPreflightChecks(async () => {
        throw error;
      }),
    );

    // WHEN
    const event = firstValueFrom(source.listen());

    // THEN
    await expect(event).resolves.toEqual({
      type: "error",
      error: {
        type: DiscoveryErrorTypes.Unknown,
        transportId: rnBleTransportIdentifier,
        error,
      },
    });
  });

  it("GIVEN BLE discovery fails, WHEN listening, THEN it should emit an unknown discovery error", async () => {
    // GIVEN
    const error = new Error("ble failure");
    const listenToAvailableDevices = jest.fn().mockReturnValue(throwError(() => error));
    const source = new RnBleDeviceDiscoverySource(
      createMockDMK(listenToAvailableDevices),
      createPreflightChecks(async () => ({ success: true })),
    );

    // WHEN
    const event = firstValueFrom(source.listen());

    // THEN
    await expect(event).resolves.toEqual({
      type: "error",
      error: {
        type: DiscoveryErrorTypes.Unknown,
        transportId: rnBleTransportIdentifier,
        error,
      },
    });
  });

  it("GIVEN a BleError with BluetoothPoweredOff is thrown mid-scan, WHEN listening, THEN it should re-run preflight and emit the typed BluetoothDisabled error", async () => {
    // GIVEN
    const bleError = Object.assign(new BleError("Bluetooth powered off", {} as never), {
      errorCode: BleErrorCode.BluetoothPoweredOff,
    });
    const bluetoothDisabledError: DiscoveryError = {
      type: DiscoveryErrorTypes.BluetoothDisabledManualAction,
      transportId: rnBleTransportIdentifier,
      resolution: { type: "manual-action", retry: jest.fn() },
    };
    const getPreflight = jest
      .fn()
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, discoveryError: bluetoothDisabledError });
    const listenToAvailableDevices = jest.fn().mockReturnValue(throwError(() => bleError));
    const source = new RnBleDeviceDiscoverySource(
      createMockDMK(listenToAvailableDevices),
      createPreflightChecks(getPreflight),
    );

    // WHEN
    const event = firstValueFrom(source.listen());

    // THEN
    await expect(event).resolves.toEqual({
      type: "error",
      error: bluetoothDisabledError,
    });
    expect(getPreflight).toHaveBeenCalledTimes(2);
  });

  it("GIVEN a typed BlePoweredOff is thrown mid-scan, WHEN listening, THEN it should re-run preflight and emit the typed BluetoothDisabled error", async () => {
    // GIVEN
    const bluetoothDisabledError: DiscoveryError = {
      type: DiscoveryErrorTypes.BluetoothDisabledPromptable,
      transportId: rnBleTransportIdentifier,
      resolution: { type: "prompt", retry: jest.fn() },
    };
    const getPreflight = jest
      .fn()
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, discoveryError: bluetoothDisabledError });
    const listenToAvailableDevices = jest
      .fn()
      .mockReturnValue(throwError(() => new BlePoweredOff("powered off")));
    const source = new RnBleDeviceDiscoverySource(
      createMockDMK(listenToAvailableDevices),
      createPreflightChecks(getPreflight),
    );

    // WHEN
    const event = firstValueFrom(source.listen());

    // THEN
    await expect(event).resolves.toEqual({
      type: "error",
      error: bluetoothDisabledError,
    });
    expect(getPreflight).toHaveBeenCalledTimes(2);
  });
});
