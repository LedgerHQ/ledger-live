import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { PolkadotContext } from "../config";
import { broadcast as logicBroadcast } from "../logic";
import { Transaction } from "../types";

/**
 * Broadcast the signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
export const buildBroadcast =
  (context: PolkadotContext): AccountBridge<Transaction>["broadcast"] =>
  async ({ signedOperation: { signature, operation }, account }) => {
    const config = await context.config(account.currency.id);
    const hash = await logicBroadcast(config, signature, account.currency.id);
    return patchOperationWithHash(operation, hash);
  };
