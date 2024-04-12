import semver from "semver";
import { DeviceModelId } from "@ledgerhq/devices";

const noVersionCondition = "<0.0.0"; // this version is never satisfied
const forceUpdateConditions: Record<DeviceModelId, string> = {
  nanoX: noVersionCondition,
  nanoS: noVersionCondition,
  nanoSP: noVersionCondition,
  blue: noVersionCondition,
  europa: noVersionCondition,
  stax: "<=1.3.0",
};

/**
 * Returns whether we should enforce a firmware update if there is one available.
 *
 * For example this is used for the Stax device as some of the first devices
 * shipped have a firmware version that is deprecated (1.3.0).
 *
 * @param currentVersion - The current firmware version.
 * @param deviceModelId - The device model id.
 */
export function shouldForceFirmwareUpdate({
  currentVersion,
  deviceModelId,
}: {
  currentVersion: string;
  deviceModelId: DeviceModelId;
}): boolean {
  return semver.satisfies(
    semver.coerce(currentVersion) ?? "",
    forceUpdateConditions[deviceModelId],
  );
}
