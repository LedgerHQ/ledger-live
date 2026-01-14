import { DeviceModelId } from "@ledgerhq/devices";
import { DeviceInfo } from "@ledgerhq/types-live";
import { satisfies, coerce } from "semver";

const usbUpdateSupportedVersions: { [key in DeviceModelId]?: string } = {
  nanoS: ">=1.6.1",
  nanoX: ">=1.3.0",
  nanoSP: ">=1.0.0",
  stax: ">=1.0.0",
  europa: ">=0.0.0",
  apex: ">=0.0.0",
};

const bleUpdateSupportedVersions: { [key in DeviceModelId]?: string } = {
  nanoX: ">=2.4.0",
  stax: ">=0.0.0",
  europa: ">=0.0.0",
  apex: ">=0.0.0",
};

export function isUsbUpdateSupported(deviceInfo: DeviceInfo, modelId: DeviceModelId): boolean {
  return (
    Boolean(usbUpdateSupportedVersions[modelId]) &&
    satisfies(coerce(deviceInfo.version), usbUpdateSupportedVersions[modelId])
  );
}

export function isBleUpdateSupported(deviceInfo: DeviceInfo, modelId: DeviceModelId): boolean {
  return (
    Boolean(bleUpdateSupportedVersions[modelId]) &&
    satisfies(coerce(deviceInfo.version), bleUpdateSupportedVersions[modelId])
  );
}
