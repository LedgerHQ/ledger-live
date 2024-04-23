import { DeviceModelId } from "@ledgerhq/devices";
import { coerce, satisfies } from "semver";

export function isEditDeviceNameSupported(deviceModelId: DeviceModelId, version: string) {
  if (deviceModelId === DeviceModelId.nanoS) {
    return satisfies(coerce(version) ?? "", ">=1.2.0");
  }
  return [
    DeviceModelId.nanoX,
    DeviceModelId.nanoSP,
    DeviceModelId.stax,
    DeviceModelId.europa,
  ].includes(deviceModelId);
}
