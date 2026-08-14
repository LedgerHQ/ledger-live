import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import type { AccountBridge } from "@ledgerhq/types-live";
import coinConfig from "../config";
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
  const config = coinConfig.getCoinConfig(account.currency.id);
  const hash = await logicBroadcast(config, signature, account.currency.id);
  return patchOperationWithHash(operation, hash);
};
