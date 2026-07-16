import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";

/**
 * @deprecated Do not use. This strips the "Ledger" prefix from the official
 * product name, which is not allowed: product names are brand assets and must
 * be displayed as-is. Use `getProductName` from `@ledgerhq/devices` to get the
 * plain, canonical product name (e.g. "Ledger Flex") instead.
 */
export const getProductName = (modelId: DeviceModelId) =>
  getDeviceModel(modelId)?.productName.replace("Ledger", "").trimStart() || modelId;
