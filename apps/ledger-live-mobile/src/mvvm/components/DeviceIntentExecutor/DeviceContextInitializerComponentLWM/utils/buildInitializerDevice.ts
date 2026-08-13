import { getDeviceModel } from "@ledgerhq/devices";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import type { InitializerDevice } from "../types";

export function buildInitializerDevice(
  connectionResult: Pick<
    DeviceConnectionResult,
    "compatDeviceId" | "compatDeviceModelId" | "compatDeviceName" | "compatDeviceWired"
  >,
): InitializerDevice {
  const { compatDeviceId, compatDeviceModelId, compatDeviceName, compatDeviceWired } =
    connectionResult;
  // Legacy device metadata still expects the enum; the app owns this temporary boundary.
  const legacyDeviceModelId = compatDeviceModelId as Parameters<typeof getDeviceModel>[0];
  const productName = getDeviceModel(legacyDeviceModelId).productName;

  return {
    id: compatDeviceId,
    modelId: legacyDeviceModelId,
    name: compatDeviceName || productName,
    productName,
    wired: compatDeviceWired,
  };
}
