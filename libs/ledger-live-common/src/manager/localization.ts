import { DeviceModelId } from "@ledgerhq/devices";
import { satisfies as versionSatisfies } from "semver";

const deviceVersionRangesForLocalization: { [key in DeviceModelId]?: string } =
  {
    nanoX: ">=2.1.0 || =2.1.0-lo2 || =2.1.0-lo4 || =2.1.0-lo5 || =2.1.0-rc1",
    nanoSP: ">=1.1.0 || =1.1.0-lo1 || =1.1.0-rc1",
  };

export const isDeviceLocalizationSupported = (
  seVersion: string,
  modelId?: DeviceModelId
): boolean =>
  modelId &&
  deviceVersionRangesForLocalization[modelId] &&
  versionSatisfies(
    seVersion,
    deviceVersionRangesForLocalization[modelId] as string
  );
