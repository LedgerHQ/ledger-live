import { DeviceModelId } from "@ledgerhq/devices";
import { satisfies as versionSatisfies, coerce as semverCoerce } from "semver";

const deviceVersionRangesForRecover: { [key in DeviceModelId]?: string } = {
  nanoX: ">=2.1.0",
  nanoSP: ">=1.1.0",
  stax: ">=1.0.0",
  europa: ">=0.0.0",
  apex: ">=0.0.0",
};

export const isRecoverSupported = (seVersion: string, modelId?: DeviceModelId): boolean =>
  !!modelId &&
  !!deviceVersionRangesForRecover[modelId] &&
  !!versionSatisfies(
    semverCoerce(seVersion) || seVersion,
    deviceVersionRangesForRecover[modelId] as string,
  );
