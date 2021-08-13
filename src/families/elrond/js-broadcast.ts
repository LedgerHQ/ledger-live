import type { Operation, SignedOperation } from "../../types";
import { patchOperationWithHash } from "../../operation";
import { broadcastTransaction } from "./api";

/**
 * Broadcast the signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
const broadcast = async ({
  signedOperation: { signature, operation },
}: {
  signedOperation: SignedOperation;
}): Promise<Operation> => {
  const {
    extra: { signUsingHash },
  } = operation;
  const { hash } = await broadcastTransaction({
    operation,
    signature,
    signUsingHash,
  });
  return patchOperationWithHash(operation, hash);
};

export default broadcast;
