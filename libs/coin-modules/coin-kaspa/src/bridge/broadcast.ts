import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import type { AccountBridge } from "@ledgerhq/types-live";
import { submitTransaction } from "../network";
import { Transaction } from "../types";

/**
 * Broadcast a signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({ signedOperation }) => {
  const { signature, operation } = signedOperation;
  const hash = (await submitTransaction(signature)).txId;
  return patchOperationWithHash(operation, hash);
};
