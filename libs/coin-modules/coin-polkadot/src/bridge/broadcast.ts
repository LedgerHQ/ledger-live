import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import type { AccountBridge } from "@ledgerhq/types-live";
import { broadcast as logicBroadcast } from "../logic";
import { Transaction } from "../types";

/**
 * Broadcast the signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { signature, operation },
  account,
}) => {
  const hash = await logicBroadcast(signature, account.currency.id);
  return patchOperationWithHash(operation, hash);
};
