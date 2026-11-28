import type { DeviceConnectionResult } from "@features/platform-device-intent";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";

/** The device of a DIE connection, in the shape the legacy settings store. */
export function toLegacyDevice({
  compatDeviceId,
  compatDeviceName,
  compatDeviceWired,
  connectedDevice,
}: DeviceConnectionResult): Device {
  return {
    deviceId: compatDeviceId,
    deviceName: compatDeviceName,
    modelId: dmkToLedgerDeviceIdMap[connectedDevice.modelId],
    wired: compatDeviceWired,
  };
}
