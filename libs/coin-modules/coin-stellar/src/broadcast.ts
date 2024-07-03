import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import type { AccountBridge, Operation, SignedOperation } from "@ledgerhq/types-live";
import { broadcastTransaction as apiBroadcast } from "./network";
import { Transaction } from "./types";

/**
 * Broadcast a signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation,
}: {
  signedOperation: SignedOperation;
}): Promise<Operation> => {
  const { signature, operation } = signedOperation;
  const hash = await apiBroadcast(signature);
  return patchOperationWithHash(operation, hash);
};

export default broadcast;
