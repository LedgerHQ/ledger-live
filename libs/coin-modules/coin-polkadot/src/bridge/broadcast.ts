import type { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { broadcast as logicBroadcast } from "../logic";
import { PolkadotAccount, Transaction } from "../types";

/**
 * Broadcast the signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  account,
  signedOperation: { signature, operation },
}) => {
  const hash = await logicBroadcast(signature, account as PolkadotAccount);
  return patchOperationWithHash(operation, hash);
};
