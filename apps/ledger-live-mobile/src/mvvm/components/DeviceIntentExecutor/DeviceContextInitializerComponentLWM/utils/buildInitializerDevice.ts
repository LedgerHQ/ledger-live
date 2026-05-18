import { getDeviceModel } from "@ledgerhq/devices";
import type { DeviceConnectionResult } from "@ledgerhq/device-intent";
import type { InitializerDevice } from "../types";

export function buildInitializerDevice(
  connectionResult: Pick<
    DeviceConnectionResult,
    "compatDeviceId" | "compatDeviceModelId" | "compatDeviceName" | "compatDeviceWired"
  >,
): InitializerDevice {
  const { compatDeviceId, compatDeviceModelId, compatDeviceName, compatDeviceWired } =
    connectionResult;
  const productName = getDeviceModel(compatDeviceModelId).productName;

  return {
    id: compatDeviceId,
    modelId: compatDeviceModelId,
    name: compatDeviceName || productName,
    productName,
    wired: compatDeviceWired,
  };
}
