import { Platform } from "react-native";
import { DeviceModelInfo } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/devices";
import isFirmwareUpdateVersionSupported from "@ledgerhq/live-common/hw/isFirmwareUpdateVersionSupported";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

const NEW_UX_SUPPORTED_DEVICES = [DeviceModelId.stax, DeviceModelId.europa, DeviceModelId.nanoX];
const versionAffected = [
  DeviceModelId.nanoX,
  DeviceModelId.nanoS,
  DeviceModelId.nanoSP,
  DeviceModelId.stax,
];

// NOTE: This is needed as some devices do not have a firmware restriction in live-common
function checkForVersion(device: Device, deviceModelInfo: DeviceModelInfo) {
  return versionAffected.includes(device.modelId)
    ? isFirmwareUpdateVersionSupported(deviceModelInfo.deviceInfo, device.modelId)
    : true;
}

export function isNewFirmwareUpdateUxSupported(
  device?: Device | null,
  deviceModelInfo?: DeviceModelInfo | null,
) {
  return device?.modelId && deviceModelInfo
    ? NEW_UX_SUPPORTED_DEVICES.includes(device.modelId) && checkForVersion(device, deviceModelInfo)
    : false;
}

export function isOldFirmwareUpdateUxSupported({
  lastSeenDeviceModelInfo,
  lastConnectedDevice,
}: {
  lastSeenDeviceModelInfo: DeviceModelInfo | null;
  lastConnectedDevice: Device | null;
}) {
  const isUsbFwVersionUpdateSupported = Boolean(
    lastSeenDeviceModelInfo &&
      isFirmwareUpdateVersionSupported(
        lastSeenDeviceModelInfo.deviceInfo,
        lastSeenDeviceModelInfo.modelId,
      ) &&
      Platform.OS === "android",
  );
  const deviceIsWired = Boolean(lastConnectedDevice?.wired);
  const updateSupported = isUsbFwVersionUpdateSupported && deviceIsWired;
  const updateSupportedButDeviceNotWired = isUsbFwVersionUpdateSupported && !deviceIsWired;

  return {
    updateSupported,
    updateSupportedButDeviceNotWired,
  };
}
