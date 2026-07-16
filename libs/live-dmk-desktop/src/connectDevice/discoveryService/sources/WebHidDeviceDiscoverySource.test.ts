import type { DeviceManagementKit, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { firstValueFrom, of, throwError } from "rxjs";

import { BaseDiscoveryErrorTypes } from "../../types";
import { webHidIdentifier as webHidTransportIdentifier } from "@ledgerhq/device-transport-kit-web-hid";
import { WebHidDeviceDiscoverySource } from "./WebHidDeviceDiscoverySource";

const createMockDMK = (listenToAvailableDevices: jest.Mock): DeviceManagementKit =>
  ({ listenToAvailableDevices }) as unknown as DeviceManagementKit;

const createDiscoveredDevice = (id: string): DiscoveredDevice =>
  ({
    id,
    name: id,
    deviceModel: { id: "model", model: "model", name: "model" },
    transport: webHidTransportIdentifier,
  }) as unknown as DiscoveredDevice;

describe("WebHidDeviceDiscoverySource", () => {
  it("GIVEN WebHID discovery emits devices, WHEN listening, THEN it should emit discovered devices", async () => {
    // GIVEN
    const devices = [createDiscoveredDevice("webhid-1")];
    const listenToAvailableDevices = jest.fn().mockReturnValue(of(devices));
    const source = new WebHidDeviceDiscoverySource(createMockDMK(listenToAvailableDevices));

    // WHEN
    const event = firstValueFrom(source.listen());

    // THEN
    await expect(event).resolves.toEqual({
      type: "devices",
      devices,
    });
    expect(listenToAvailableDevices).toHaveBeenCalledWith({ transport: webHidTransportIdentifier });
  });

  it("GIVEN WebHID discovery fails, WHEN listening, THEN it should emit an unknown discovery error", async () => {
    // GIVEN
    const error = new Error("webhid failure");
    const listenToAvailableDevices = jest.fn().mockReturnValue(throwError(() => error));
    const source = new WebHidDeviceDiscoverySource(createMockDMK(listenToAvailableDevices));

    // WHEN
    const event = firstValueFrom(source.listen());

    // THEN
    await expect(event).resolves.toEqual({
      type: "error",
      error: {
        type: BaseDiscoveryErrorTypes.Unknown,
        transportId: webHidTransportIdentifier,
        error,
      },
    });
  });
});
