import { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "../../operation";

import { broadcastTransaction } from "./api/node";

/**
 * Broadcast the signed transaction
 */
export default async function broadcast({
  account,
  signedOperation,
}: {
  account: Account;
  signedOperation: SignedOperation;
}): Promise<Operation> {
  const { hash } = await broadcastTransaction(signedOperation, account.currency);
  return patchOperationWithHash(signedOperation.operation, hash);
}
