import type { Operation, SignedOperation } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "../../operation";
import { Transaction } from "thor-devkit";
import { submit } from "./api";

/**
 * Broadcast the signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
const broadcast = async ({
  signedOperation: { signature, operation },
}: {
  signedOperation: SignedOperation;
}): Promise<Operation> => {
  const transaction = new Transaction(operation.extra.transaction.body);
  transaction.signature = Buffer.from(signature, "hex");
  const hash = await submit(transaction);

  return patchOperationWithHash(operation, hash);
};

export default broadcast;
