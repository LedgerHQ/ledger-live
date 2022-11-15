import type { Operation, SignedOperation } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "../../operation";
import { sendTransaction } from "./api";

/**
 * Broadcast the signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
export const broadcast = async ({
  signedOperation: { signature, operation },
}: {
  signedOperation: SignedOperation;
}): Promise<Operation> => {
  const hash = await sendTransaction(
    JSON.parse(signature) as CKBComponents.RawTransaction
  );
  return patchOperationWithHash(operation, hash);
};
