import { DeviceModelId } from "@ledgerhq/devices";
import { Transaction } from "../types";

export type Resolution = {
  deviceModelId?: DeviceModelId | undefined;
  certificateSignatureKind?: "prod" | "test" | undefined;
  tokenAddress?: string;
  tokenId?: string;
};

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
