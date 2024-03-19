import { Platform } from "react-native";
import { DeviceModelInfo } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/devices";
import isFirmwareUpdateVersionSupported from "@ledgerhq/live-common/hw/isFirmwareUpdateVersionSupported";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

const NEW_UX_SUPPORTED_DEVICES = [DeviceModelId.stax, DeviceModelId.europa];

export function isNewFirmwareUpdateUxSupported(deviceModelId?: DeviceModelId) {
  return deviceModelId ? NEW_UX_SUPPORTED_DEVICES.includes(deviceModelId) : false;
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
