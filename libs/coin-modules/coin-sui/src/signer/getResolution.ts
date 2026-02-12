import type { DeviceModelId } from "@ledgerhq/devices";
import type { Transaction } from "../types/bridge";
import type { Resolution } from "../types/model";

const getResolution = (
  transaction: Transaction,
  deviceModelId?: DeviceModelId,
  certificateSignatureKind?: "prod" | "test",
): Resolution | undefined => {
  if (!transaction.subAccountId || transaction.mode !== "token.send" || !transaction.tokenId) {
    return;
  }

  const { tokenId, coinType } = transaction;

  return {
    deviceModelId,
    certificateSignatureKind,
    tokenId,
    tokenAddress: coinType,
  };
};

export default getResolution;
