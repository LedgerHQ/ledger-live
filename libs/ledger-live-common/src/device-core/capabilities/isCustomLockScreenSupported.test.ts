import { DeviceModelId } from "@ledgerhq/devices";
import {
  isCustomLockScreenSupported,
  supportedDeviceModelIds,
} from "./isCustomLockScreenSupported";

describe("isCustomLockScreenSupported", () => {
  it("should return true if sync onboarding is supported", () => {
    expect(isCustomLockScreenSupported(DeviceModelId.stax)).toBe(true);
    expect(isCustomLockScreenSupported(DeviceModelId.europa)).toBe(true);
  });

  it("should return false if sync onboarding is not supported", () => {
    expect(isCustomLockScreenSupported(DeviceModelId.nanoS)).toBe(false);
    expect(isCustomLockScreenSupported(DeviceModelId.nanoSP)).toBe(false);
    expect(isCustomLockScreenSupported(DeviceModelId.nanoX)).toBe(false);
    expect(isCustomLockScreenSupported(DeviceModelId.blue)).toBe(false);
  });
});

describe("supportedDeviceModelIds", () => {
  it("should return supported device model ids", () => {
    expect(supportedDeviceModelIds).toEqual([DeviceModelId.stax, DeviceModelId.europa]);
  });
});
