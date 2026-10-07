import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { minimumNanoVersions, requiresLegacyFlow } from "@ledgerhq/device-onboarding";
import semver from "semver";
import { devices, OsSlot } from "./deviceClass";

describe("OnboardingDevice", () => {
  it("keeps a nano x on its floor and sends one below that floor to the old flow", () => {
    const nanoX = devices.nanoX;

    expect(nanoX.os(OsSlot.On)).toBe(minimumNanoVersions.get(DeviceModelId.NANO_X));
    expect(nanoX.os(OsSlot.Latest)).toBe(nanoX.cloud);
    expect(nanoX.latest).toBe(nanoX.cloud);
    expect(semver.lt(nanoX.os(OsSlot.Below), nanoX.on)).toBe(true);
    expect(semver.gt(nanoX.os(OsSlot.Above), nanoX.on)).toBe(true);
    expect(semver.gt(nanoX.cloud, nanoX.on)).toBe(true);
    expect(
      requiresLegacyFlow({
        currentVersion: nanoX.os(OsSlot.Below),
        deviceModelId: nanoX.dmkModelId,
      }),
    ).toBe(true);
    expect(
      requiresLegacyFlow({
        currentVersion: nanoX.os(OsSlot.On),
        deviceModelId: nanoX.dmkModelId,
      }),
    ).toBe(false);
  });

  it("marks a stax under the cloud version as old, and keeps it in the new flow", () => {
    const stax = devices.stax;

    expect(stax.floor).toBeNull();
    expect(stax.os(OsSlot.Latest)).toBe(stax.cloud);
    expect(semver.lt(stax.os(OsSlot.Below), stax.cloud)).toBe(true);
    expect(
      requiresLegacyFlow({
        currentVersion: stax.os(OsSlot.Below),
        deviceModelId: stax.dmkModelId,
      }),
    ).toBe(false);
  });
});
