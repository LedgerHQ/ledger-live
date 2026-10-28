import type { DeviceManagementKit, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { webBleIdentifier } from "@ledgerhq/device-transport-kit-web-ble";
import { firstValueFrom, of, throwError } from "rxjs";

import { BaseDiscoveryErrorTypes } from "../../types";
import { WebBleDeviceDiscoverySource } from "./WebBleDeviceDiscoverySource";

const createMockDMK = (listenToAvailableDevices: jest.Mock): DeviceManagementKit =>
  ({ listenToAvailableDevices }) as unknown as DeviceManagementKit;

const createDiscoveredDevice = (id: string): DiscoveredDevice =>
  ({
    id,
    name: id,
    deviceModel: { id: "model", model: "model", name: "model" },
    transport: webBleIdentifier,
  }) as unknown as DiscoveredDevice;

describe("WebBleDeviceDiscoverySource", () => {
  it("GIVEN Web BLE discovery emits devices, WHEN listening, THEN it should emit discovered devices", async () => {
    // GIVEN
    const devices = [createDiscoveredDevice("webble-1")];
    const listenToAvailableDevices = jest.fn().mockReturnValue(of(devices));
    const source = new WebBleDeviceDiscoverySource(createMockDMK(listenToAvailableDevices));

    // WHEN
    const event = firstValueFrom(source.listen());

    // THEN
    await expect(event).resolves.toEqual({ type: "devices", devices });
    expect(source.transportId).toBe(webBleIdentifier);
    expect(listenToAvailableDevices).toHaveBeenCalledWith({ transport: webBleIdentifier });
  });

  it("GIVEN Web BLE discovery fails, WHEN listening, THEN it should emit an unknown discovery error", async () => {
    // GIVEN
    const error = new Error("webble failure");
    const listenToAvailableDevices = jest.fn().mockReturnValue(throwError(() => error));
    const source = new WebBleDeviceDiscoverySource(createMockDMK(listenToAvailableDevices));

    // WHEN
    const event = firstValueFrom(source.listen());

    // THEN
    await expect(event).resolves.toEqual({
      type: "error",
      error: { type: BaseDiscoveryErrorTypes.Unknown, transportId: webBleIdentifier, error },
    });
  });
});
