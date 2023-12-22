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
  const { signature, rawData, operation } = signedOperation;
  const { hash } = await broadcastTransaction({ signature, rawData }, account.currency);
  return patchOperationWithHash(operation, hash);
}
