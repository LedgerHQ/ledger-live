import type { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { broadcast as broadcastLogic } from "../logic";
import type { Transaction } from "../types";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  account,
  signedOperation: { signature, operation },
}) => {
  const hash = await broadcastLogic(signature, account.currency.id);
  if (!hash) {
    throw new Error("concordium: broadcast returned no transaction id");
  }
  return patchOperationWithHash(operation, hash);
};
