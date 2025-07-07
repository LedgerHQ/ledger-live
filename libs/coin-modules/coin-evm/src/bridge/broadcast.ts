import type { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { Transaction as EvmTransaction } from "../types";
import broadcastLogic from "../logic/broadcast";

/**
 * Broadcast a transaction and update the operation linked
 */
export const broadcast: AccountBridge<EvmTransaction>["broadcast"] = async ({
  account,
  signedOperation: { signature, operation },
  broadcastConfig,
}) => {
  const hash = await broadcastLogic({
    currency: account.currency,
    signature,
    broadcastConfig,
  });
  return patchOperationWithHash(operation, hash);
};

export default broadcast;
