import { ScannedDevice } from "@ledgerhq/live-dmk-mobile";
import { type ScannedDevice as LegacyScannedDevice } from "@ledgerhq/live-common/ble/types";

export function mapLegacyScannedDeviceToScannedDevice(device: LegacyScannedDevice): ScannedDevice {
  return {
    deviceId: device.deviceId,
    deviceName: device.deviceName,
    wired: false,
    modelId: device.deviceModel.id,
  };
}
