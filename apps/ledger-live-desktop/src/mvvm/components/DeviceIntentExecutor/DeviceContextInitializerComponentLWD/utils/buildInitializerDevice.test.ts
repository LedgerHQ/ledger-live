import type { DeviceConnectionResult } from "@ledgerhq/device-intent";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { buildInitializerDevice } from "./buildInitializerDevice";

describe("buildInitializerDevice", () => {
  it("GIVEN a connection result with a custom name WHEN building the initializer device THEN it preserves the name and wired flag", () => {
    // GIVEN
    const connectionResult = {
      compatDeviceId: "device-id",
      compatDeviceModelId: DeviceModelId.nanoX,
      compatDeviceName: "Olivier's Ledger",
      compatDeviceWired: true,
    } satisfies Pick<
      DeviceConnectionResult,
      "compatDeviceId" | "compatDeviceModelId" | "compatDeviceName" | "compatDeviceWired"
    >;

    // WHEN
    const device = buildInitializerDevice(connectionResult);

    // THEN
    expect(device).toEqual({
      id: "device-id",
      modelId: DeviceModelId.nanoX,
      name: "Olivier's Ledger",
      productName: expect.stringContaining("Nano"),
      wired: true,
    });
  });

  it("GIVEN a connection result without a custom name WHEN building the initializer device THEN it falls back to the product name", () => {
    // GIVEN
    const connectionResult = {
      compatDeviceId: "device-id",
      compatDeviceModelId: DeviceModelId.nanoX,
      compatDeviceName: "",
      compatDeviceWired: false,
    } satisfies Pick<
      DeviceConnectionResult,
      "compatDeviceId" | "compatDeviceModelId" | "compatDeviceName" | "compatDeviceWired"
    >;

    // WHEN
    const device = buildInitializerDevice(connectionResult);

    // THEN
    expect(device.name).toBe(device.productName);
    expect(device.productName).toEqual(expect.stringContaining("Nano"));
    expect(device.wired).toBe(false);
  });
});
