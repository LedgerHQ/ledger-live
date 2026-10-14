import type { DeviceManagementKit, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { speculosIdentifier } from "@ledgerhq/device-transport-kit-speculos";
import { firstValueFrom, of, throwError } from "rxjs";
import { BaseDiscoveryErrorTypes } from "../../types";
import { SpeculosDeviceDiscoverySource } from "./SpeculosDeviceDiscoverySource";

const createMockDMK = (listenToAvailableDevices: jest.Mock): DeviceManagementKit =>
  ({ listenToAvailableDevices }) as unknown as DeviceManagementKit;

const speculosDevice = {
  id: "SpeculosID",
  name: "SpeculosID",
  deviceModel: { id: "nanoX", model: "nanoX", name: "Nano X" },
  transport: speculosIdentifier,
} as unknown as DiscoveredDevice;

describe("SpeculosDeviceDiscoverySource", () => {
  it("GIVEN Speculos discovery emits a device, WHEN listening, THEN it should emit discovered devices", async () => {
    const devices = [speculosDevice];
    const listenToAvailableDevices = jest.fn().mockReturnValue(of(devices));
    const source = new SpeculosDeviceDiscoverySource(createMockDMK(listenToAvailableDevices));

    const event = firstValueFrom(source.listen());

    await expect(event).resolves.toEqual({
      type: "devices",
      devices,
    });
    expect(listenToAvailableDevices).toHaveBeenCalledWith({ transport: speculosIdentifier });
  });

  it("GIVEN Speculos discovery fails, WHEN listening, THEN it should emit an unknown discovery error", async () => {
    const error = new Error("speculos unreachable");
    const listenToAvailableDevices = jest.fn().mockReturnValue(throwError(() => error));
    const source = new SpeculosDeviceDiscoverySource(createMockDMK(listenToAvailableDevices));

    const event = firstValueFrom(source.listen());

    await expect(event).resolves.toEqual({
      type: "error",
      error: {
        type: BaseDiscoveryErrorTypes.Unknown,
        transportId: speculosIdentifier,
        error,
      },
    });
  });
});
