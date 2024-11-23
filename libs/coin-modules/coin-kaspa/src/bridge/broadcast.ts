import type { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { Transaction } from "../types/bridge";
import { submitTransaction } from "../network";

/**
 * Broadcast a signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({ signedOperation }) => {
  const { signature, operation } = signedOperation;
  console.log("transmitting: ", signature);
  const hash = (await submitTransaction(signature)).txId;
  return patchOperationWithHash(operation, hash);
};
