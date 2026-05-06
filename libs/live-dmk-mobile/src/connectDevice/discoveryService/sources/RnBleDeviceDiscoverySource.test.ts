import type { DeviceManagementKit, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
import { firstValueFrom, of, throwError } from "rxjs";
import { DiscoveryErrors, type DiscoveryError } from "../../types";
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
  type: DiscoveryErrors.BluetoothUnsupported,
  transportID: rnBleTransportIdentifier,
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
        type: DiscoveryErrors.Unknown,
        transportID: rnBleTransportIdentifier,
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
        type: DiscoveryErrors.Unknown,
        transportID: rnBleTransportIdentifier,
        error,
      },
    });
  });
});
