import type { BroadcastFnSignature, Operation } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "../../operation";
import { broadcastTransaction } from "./api";

/**
 * Broadcast the signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
const broadcast: BroadcastFnSignature = async ({ signedOperation }): Promise<Operation> => {
  const hash = await broadcastTransaction(signedOperation);

  return patchOperationWithHash(signedOperation.operation, hash);
};

export default broadcast;
