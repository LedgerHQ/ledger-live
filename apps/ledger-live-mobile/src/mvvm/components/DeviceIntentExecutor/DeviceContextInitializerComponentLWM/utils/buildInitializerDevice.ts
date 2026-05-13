import { getDeviceModel } from "@ledgerhq/devices";
import type { DeviceConnectionResult } from "@ledgerhq/device-intent";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  supportedDeviceActionModelIds,
  type SupportedDeviceActionModelId,
} from "LLM/components/DeviceActionContent";
import type { InitializerDevice } from "../types";

const fallbackDeviceModelId = DeviceModelId.nanoX;

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
    supportedModelId: getSupportedDeviceActionModelId(compatDeviceModelId),
    name: compatDeviceName || getDeviceModel(compatDeviceModelId)?.productName || productName,
    productName,
    wired: compatDeviceWired,
  };
}

function getSupportedDeviceActionModelId(modelId: DeviceModelId): SupportedDeviceActionModelId {
  return supportedDeviceActionModelIds.includes(modelId as SupportedDeviceActionModelId)
    ? (modelId as SupportedDeviceActionModelId)
    : fallbackDeviceModelId;
}
