import { satisfies, coerce } from "semver";
import { DeviceModelId } from "@ledgerhq/devices";

const deviceVersionRangesForHardwareVersion: {
  [key in DeviceModelId]?: string;
} = {
  nanoX: ">=2.0.0",
};
/**
 * @returns whether the Hardware Version bytes are included in the result of the
 * getVersion APDU
 * */

export const isHardwareVersionSupported = (seVersion: string, modelId?: DeviceModelId): boolean =>
  !!modelId &&
  !!deviceVersionRangesForHardwareVersion[modelId] &&
  !!satisfies(
    coerce(seVersion) || seVersion,
    deviceVersionRangesForHardwareVersion[modelId] as string,
  );
