import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { AccountBridge } from "@ledgerhq/types-live";
import { broadcast as broadcastLogic } from "../logic/broadcast";
import { Transaction } from "../types";
import coinConfig from "../config";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { signature, operation },
}) => {
  const hash = await broadcastLogic(coinConfig.getCoinConfig(), signature);
  return patchOperationWithHash(operation, hash);
};
