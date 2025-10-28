import { DeviceModelId } from "@ledgerhq/devices";
import { getDeviceHasBattery } from "./getDeviceHasBattery";

describe("getDeviceHasBattery", () => {
  it("should return true for supported devices", () => {
    expect(getDeviceHasBattery(DeviceModelId.stax)).toBe(true);
    expect(getDeviceHasBattery(DeviceModelId.europa)).toBe(true);
    expect(getDeviceHasBattery(DeviceModelId.apex)).toBe(true);
    expect(getDeviceHasBattery(DeviceModelId.nanoX)).toBe(true);
  });
  it("should return false for unsupported devices", () => {
    expect(getDeviceHasBattery(DeviceModelId.nanoS)).toBe(false);
    expect(getDeviceHasBattery(DeviceModelId.nanoSP)).toBe(false);
  });
});
