import { DeviceModelId } from "@ledgerhq/devices";
import { satisfies as versionSatisfies } from "semver";

const deviceVersionRangesForLocalization: { [key in DeviceModelId]?: string } =
  {
    nanoX: ">=2.1.0 || =2.1.0-lo2 || =2.1.0-lo4",
    nanoSP: ">=1.1.0 || =1.1.0-lo1",
  };

export const isDeviceLocalizationSupported = (
  seVersion: string,
  modelId?: DeviceModelId
) =>
  modelId &&
  deviceVersionRangesForLocalization[modelId] &&
  versionSatisfies(
    seVersion,
    deviceVersionRangesForLocalization[modelId] as string
  );
