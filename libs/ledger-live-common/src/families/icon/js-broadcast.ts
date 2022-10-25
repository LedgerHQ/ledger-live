import type { Operation } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "../../operation";

import { broadcastTransaction } from "./api";

/**
 * Broadcast the signed transaction
 * @param {signature: any, operation: any} signedOperation
 */
const broadcast = async ({
  signedOperation: { signature, operation },
  account,
}): Promise<Operation> => {
  const { hash } = await broadcastTransaction(signature, account.currency);
  return patchOperationWithHash(operation, hash);
};

export default broadcast;
