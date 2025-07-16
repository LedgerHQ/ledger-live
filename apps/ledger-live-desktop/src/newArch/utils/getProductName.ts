import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";

export const getProductName = (modelId: DeviceModelId) =>
  getDeviceModel(modelId)?.productName.replace("Ledger", "").trimStart() || modelId;
