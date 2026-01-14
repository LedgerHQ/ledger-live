import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";

export const getProductName = (modelId: DeviceModelId) =>
  getDeviceModel(modelId)?.productName.replace("Ledger", "").trimStart() || modelId;
