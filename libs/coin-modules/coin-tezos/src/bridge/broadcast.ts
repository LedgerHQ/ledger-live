import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { AccountBridge, SignedOperation } from "@ledgerhq/types-live";
import { Transaction } from "../types";
import { broadcast as logicBroadcast } from "../logic";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { operation, signature },
}: {
  signedOperation: SignedOperation;
}) => {
  const hash = await logicBroadcast(signature);
  return patchOperationWithHash(operation, hash);
};
