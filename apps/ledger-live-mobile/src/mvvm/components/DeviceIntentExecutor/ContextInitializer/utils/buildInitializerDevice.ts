import { getDeviceModel } from "@ledgerhq/devices";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { InitializerDevice } from "../types";

export function buildInitializerDevice(
  connectionResult: Pick<
    DeviceConnectionResult,
    "compatDeviceId" | "compatDeviceName" | "compatDeviceWired" | "connectedDevice"
  >,
): InitializerDevice {
  const { compatDeviceId, compatDeviceName, compatDeviceWired, connectedDevice } = connectionResult;
  const modelId = dmkToLedgerDeviceIdMap[connectedDevice.modelId];
  const productName = getDeviceModel(modelId).productName;

  return {
    id: compatDeviceId,
    modelId,
    name: compatDeviceName || productName,
    productName,
    wired: compatDeviceWired,
  };
}
