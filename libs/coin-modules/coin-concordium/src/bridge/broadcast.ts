import type { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { broadcast as broadcastLogic } from "../logic";
import type { ConcordiumContext, Transaction } from "../types";

export const buildBroadcast =
  (context: ConcordiumContext): AccountBridge<Transaction>["broadcast"] =>
  async ({ account, signedOperation: { signature, operation } }) => {
    const config = await context.config(account.currency.id);
    const hash = await broadcastLogic(config, signature, account.currency.id);
    if (!hash) {
      throw new Error("concordium: broadcast returned no transaction id");
    }
    return patchOperationWithHash(operation, hash);
  };
