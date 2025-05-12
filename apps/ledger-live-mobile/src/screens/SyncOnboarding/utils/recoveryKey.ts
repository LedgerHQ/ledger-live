import { DeviceModelId } from "@ledgerhq/types-devices";
import { gte } from "semver";

export const isLedgerRecoveryKeyCompatible = (deviceModelId: DeviceModelId, seVersion?: string) => {
  if (!seVersion) return false;
  return (
    (deviceModelId === DeviceModelId.stax && seVersion && gte(seVersion, "1.7.0")) ||
    (deviceModelId === DeviceModelId.europa && seVersion && gte(seVersion, "1.3.0"))
  );
};
