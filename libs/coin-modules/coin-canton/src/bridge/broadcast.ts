import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { AccountBridge } from "@ledgerhq/types-live";
import { broadcast as broadcastLogic } from "../common-logic";
import { Transaction } from "../types";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  account,
  signedOperation,
}) => {
  const { operation, signature } = signedOperation;
  const hash = await broadcastLogic(account.currency, signature);
  return patchOperationWithHash(operation, hash);
};
