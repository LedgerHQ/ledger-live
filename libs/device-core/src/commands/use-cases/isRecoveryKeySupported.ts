import { DeviceModelId } from "@ledgerhq/devices/lib/index";
import { satisfies as versionSatisfies, coerce as semverCoerce } from "semver";

const deviceVersionRangesForRecoveryKey: { [key in DeviceModelId]?: string } = {
  stax: ">=1.7.0",
  europa: ">=1.4.0",
};

export const isRecoveryKeySupported = (seVersion: string, modelId?: DeviceModelId): boolean => {
  return (
    !!modelId &&
    !!deviceVersionRangesForRecoveryKey[modelId] &&
    !!versionSatisfies(
      semverCoerce(seVersion) || seVersion,
      deviceVersionRangesForRecoveryKey[modelId] as string,
    )
  );
};
