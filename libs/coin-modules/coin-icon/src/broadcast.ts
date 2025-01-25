import { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";

import { broadcastTransaction } from "./api/node";

/**
 * Broadcast the signed transaction
 */
export async function broadcast({
  account,
  signedOperation,
}: {
  account: Account;
  signedOperation: SignedOperation;
}): Promise<Operation> {
  const { hash } = await broadcastTransaction(signedOperation, account.currency);
  return patchOperationWithHash(signedOperation.operation, hash);
}
