import type { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { broadcast as broadcastLogic } from "../logic";
import { withConfig, type ConcordiumContext, type Transaction } from "../types";

export const buildBroadcast =
  (context: ConcordiumContext): AccountBridge<Transaction>["broadcast"] =>
  async ({ account, signedOperation: { signature, operation } }) => {
    const pinned = withConfig(context, await context.config(account.currency.id));
    const hash = await broadcastLogic(pinned, signature);
    if (!hash) {
      throw new Error("concordium: broadcast returned no transaction id");
    }
    return patchOperationWithHash(operation, hash);
  };
