import type { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "../../operation";
import { broadcastTransaction } from "./api";
import { Transaction } from "./types";

/**
 * Broadcast the signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({ signedOperation }) => {
  const hash = await broadcastTransaction(signedOperation);

  return patchOperationWithHash(signedOperation.operation, hash);
};

export default broadcast;
