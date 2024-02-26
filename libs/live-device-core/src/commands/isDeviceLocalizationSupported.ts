import { DeviceModelId } from "@ledgerhq/devices";
import { satisfies, coerce } from "semver";

const deviceVersionRangesForLocalization: { [key in DeviceModelId]?: string } = {
  nanoX: ">=2.1.0",
  nanoSP: ">=1.1.0",
  stax: ">=1.0.0",
};

export const isDeviceLocalizationSupported = (
  seVersion: string,
  modelId?: DeviceModelId,
): boolean =>
  !!modelId &&
  !!deviceVersionRangesForLocalization[modelId] &&
  !!satisfies(
    coerce(seVersion) || seVersion,
    deviceVersionRangesForLocalization[modelId] as string,
  );
