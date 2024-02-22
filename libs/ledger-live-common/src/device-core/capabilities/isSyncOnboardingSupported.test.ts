import { DeviceModelId } from "@ledgerhq/devices";
import { isSyncOnboardingSupported } from "./isSyncOnboardingSupported";

describe("isSyncOnboardingSupported", () => {
  it("should return true if sync onboarding is supported", () => {
    expect(isSyncOnboardingSupported(DeviceModelId.stax)).toBe(true);
    expect(isSyncOnboardingSupported(DeviceModelId.europa)).toBe(true);
  });

  it("should return false if sync onboarding is not supported", () => {
    expect(isSyncOnboardingSupported(DeviceModelId.nanoS)).toBe(false);
    expect(isSyncOnboardingSupported(DeviceModelId.nanoSP)).toBe(false);
    expect(isSyncOnboardingSupported(DeviceModelId.nanoX)).toBe(false);
    expect(isSyncOnboardingSupported(DeviceModelId.blue)).toBe(false);
  });
});
