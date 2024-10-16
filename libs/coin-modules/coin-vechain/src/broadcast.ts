import { Transaction as VeChainThorTransaction } from "thor-devkit";
import type { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/lib/operation";

import { Transaction } from "./types";
import { submit } from "./api";

/**
 * Broadcast the signed transaction
 */
export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { signature, operation, rawData },
}) => {
  const transaction = new VeChainThorTransaction(
    (rawData as unknown as VeChainThorTransaction).body,
  );
  transaction.signature = Buffer.from(signature, "hex");
  const hash = await submit(transaction);

  return patchOperationWithHash(operation, hash);
};

export default broadcast;
