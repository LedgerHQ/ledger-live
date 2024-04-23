import { DeviceModelId } from "@ledgerhq/devices";
import { isEditDeviceNameSupported } from "./isEditDeviceNameSupported";

const supportedDevices = [
  DeviceModelId.stax,
  DeviceModelId.nanoX,
  DeviceModelId.europa,
  DeviceModelId.nanoSP,
];
const unsupportedDevices = [DeviceModelId.blue];

const supportedNanoSVersions = ["1.2.0", "1.2.0-whatever", "1.3.0", "1.3.0-whatever"];
const unsupportedNanoSVersions = ["1.1.0", "1.1.0-whatever", "whatever"];

describe("isEditDeviceNameSupported", () => {
  it("should return true for supported devices", () => {
    // devices that are supported at any version
    supportedDevices.forEach((deviceModelId: DeviceModelId) => {
      expect(isEditDeviceNameSupported(deviceModelId, "whatever")).toBe(true);
    });
    // nano S (depends on version)
    supportedNanoSVersions.forEach((version: string) => {
      expect(isEditDeviceNameSupported(DeviceModelId.nanoS, version)).toBe(true);
    });
  });

  it("should return false for unsupported devices", () => {
    // devices that are never supported
    unsupportedDevices.forEach((deviceModelId: DeviceModelId) => {
      expect(isEditDeviceNameSupported(deviceModelId, "whatever")).toBe(false);
    });
    // nano S (depends on version)
    unsupportedNanoSVersions.forEach((version: string) => {
      expect(isEditDeviceNameSupported(DeviceModelId.nanoS, version)).toBe(false);
    });
  });
});
