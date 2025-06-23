import { DeviceModelId } from "@ledgerhq/devices/lib/index";
import { satisfies as versionSatisfies, coerce as semverCoerce } from "semver";

const deviceVersionRangesForCharon: { [key in DeviceModelId]?: string } = {
  stax: ">=1.7.0",
  europa: ">=1.3.0",
};

export const isCharonSupported = (seVersion: string, modelId?: DeviceModelId): boolean => {
  return (
    !!modelId &&
    !!deviceVersionRangesForCharon[modelId] &&
    !!versionSatisfies(
      semverCoerce(seVersion) || seVersion,
      deviceVersionRangesForCharon[modelId] as string,
    )
  );
};
