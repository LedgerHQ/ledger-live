import { DeviceModelId } from "@ledgerhq/devices";
import { DeviceInfo } from "@ledgerhq/types-live";
import { satisfies as versionSatisfies } from "semver";

const deviceVersionRangesForUpdate: { [key in DeviceModelId]?: string } = {
  nanoS: ">=1.6.1",
  nanoX: ">=1.2.4-6",
  nanoSP: ">=1.0.0-0",
};

export const isFirmwareUpdateVersionSupported = (
  deviceInfo: DeviceInfo,
  modelId: DeviceModelId,
) =>
  Boolean(deviceVersionRangesForUpdate[modelId]) &&
  versionSatisfies(
    deviceInfo.version,
    deviceVersionRangesForUpdate[modelId] as string,
  );
