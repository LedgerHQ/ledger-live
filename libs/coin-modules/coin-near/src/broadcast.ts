import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import type { AccountBridge } from "@ledgerhq/types-live";
import { broadcastTransaction } from "./network";
import { getCoinConfig } from "./config";
import { Transaction } from "./types";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { signature, operation },
}) => {
  const hash = await broadcastTransaction(getCoinConfig(), signature);

  return patchOperationWithHash(operation, hash);
};

export default broadcast;
