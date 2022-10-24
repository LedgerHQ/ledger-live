import type { Operation, SignedOperation } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "../../operation";
import { broadcastTransaction } from "./api";

/**
 * Broadcast the signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
const broadcast = async ({
  signedOperation: { signature, operation, signatureRaw },
}: {
  signedOperation: SignedOperation;
}): Promise<Operation> => {
  const hash = await broadcastTransaction({
    signatureRaw,
    signature,
  } as SignedOperation);

  return patchOperationWithHash(operation, hash);
};

export default broadcast;
