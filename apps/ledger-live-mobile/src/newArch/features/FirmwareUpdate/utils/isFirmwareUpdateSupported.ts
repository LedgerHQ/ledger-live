import { DeviceModelInfo } from "@ledgerhq/types-live";
import {
  isBleUpdateSupported as isBleUpdateSupportedCommon,
  isUsbUpdateSupported,
} from "@ledgerhq/live-common/hw/isFirmwareUpdateVersionSupported";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

export function isBleUpdateSupported(
  device?: Device | null,
  deviceModelInfo?: DeviceModelInfo | null,
) {
  if (!device || !deviceModelInfo) return false;
  return isBleUpdateSupportedCommon(deviceModelInfo.deviceInfo, device.modelId);
}

export function isNewFirmwareUpdateUxSupported(
  device?: Device | null,
  deviceModelInfo?: DeviceModelInfo | null,
) {
  if (!device || !deviceModelInfo) return false;
  return isUsbUpdateSupported(deviceModelInfo.deviceInfo, device.modelId);
}
