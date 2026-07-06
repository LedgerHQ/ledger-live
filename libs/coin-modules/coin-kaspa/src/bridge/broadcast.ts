import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import type { AccountBridge } from "@ledgerhq/types-live";
import { broadcast as broadcastTransaction } from "../logic/broadcast";
import { Transaction } from "../types";

/**
 * Broadcast a signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({ signedOperation }) => {
  const { signature, operation } = signedOperation;
  const hash = await broadcastTransaction(signature);
  return patchOperationWithHash(operation, hash);
};
