import type { ConnectedDevice } from "@ledgerhq/device-management-kit";
import { getDeviceModel } from "@ledgerhq/devices";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";

/**
 * Bridges the DMK connected device to what the shared device UI (animations, wording) expects.
 */
export function useOsUpdateDevice(connectedDevice: ConnectedDevice) {
  const deviceModelId = dmkToLedgerDeviceIdMap[connectedDevice.modelId];
  const { productName } = getDeviceModel(deviceModelId);

  return { deviceModelId, deviceName: connectedDevice.name, productName };
}

export type OsUpdateDevice = ReturnType<typeof useOsUpdateDevice>;
