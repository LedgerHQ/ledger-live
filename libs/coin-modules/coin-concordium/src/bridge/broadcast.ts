import { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { broadcast as broadcastLogic } from "../logic";
import { Transaction } from "../types";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  account,
  signedOperation: { signature, operation },
}) => {
  const hash = await broadcastLogic(signature, account.currency);
  return patchOperationWithHash(operation, hash);
};
