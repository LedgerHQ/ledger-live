import { satisfies as versionSatisfies, coerce as semverCoerce } from "semver";
import { DeviceModelId } from "@ledgerhq/devices";

const deviceVersionRangesForBootloaderVersion: {
  [key in DeviceModelId]?: string;
} = {
  nanoS: ">=2.0.0",
  nanoX: ">=2.0.0",
  nanoSP: ">=1.0.0",
  stax: ">=1.0.0",
  europa: ">=1.0.0",
};
/**
 * @returns whether the Bootloader Version bytes are included in the result of the
 * getVersion APDU
 **/

export const isBootloaderVersionSupported = (seVersion: string, modelId?: DeviceModelId): boolean =>
  !!modelId &&
  !!deviceVersionRangesForBootloaderVersion[modelId] &&
  !!versionSatisfies(
    semverCoerce(seVersion) || seVersion,
    deviceVersionRangesForBootloaderVersion[modelId] as string,
  );
