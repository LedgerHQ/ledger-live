import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import type { AccountBridge } from "@ledgerhq/types-live";
import algorandAPI from "./api";
import { Transaction } from "./types";

/**
 * Broadcast a signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({ signedOperation }) => {
  const { signature, operation } = signedOperation;
  const hash = await algorandAPI.broadcastTransaction(Buffer.from(signature, "hex"));
  return patchOperationWithHash(operation, hash);
};
