import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { AccountBridge } from "@ledgerhq/types-live";
import { broadcast as broadcastLogic } from "../logic/broadcast";
import { Transaction } from "../types";
import { getBridgeContext } from "./context";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  account,
  signedOperation,
}) => {
  const { operation, signature } = signedOperation;
  const hash = await broadcastLogic(getBridgeContext(account.currency), signature);
  if (!hash) {
    throw new Error("canton: broadcast returned no transaction id");
  }
  return patchOperationWithHash(operation, hash);
};
