import { DeviceModelId } from "@ledgerhq/types-devices";
import { isEditDeviceNameSupported } from "./isEditDeviceNameSupported";

const supportedDevices = [DeviceModelId.stax, DeviceModelId.nanoX, DeviceModelId.europa];
const unsupportedDevices = [DeviceModelId.nanoS, DeviceModelId.blue, DeviceModelId.nanoSP];

describe("isEditDeviceNameSupported", () => {
  it("should return true for supported devices", () => {
    supportedDevices.forEach((deviceModelId: DeviceModelId) => {
      expect(isEditDeviceNameSupported(deviceModelId)).toBe(true);
    });
  });
  it("should return false for unsupported devices", () => {
    unsupportedDevices.forEach((deviceModelId: DeviceModelId) => {
      expect(isEditDeviceNameSupported(deviceModelId)).toBe(false);
    });
  });
});
