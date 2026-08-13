import type { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { broadcast as broadcastLogic } from "../logic";
import type { Transaction } from "../types";
import coinConfig from "../config";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  account,
  signedOperation: { signature, operation },
}) => {
  const config = coinConfig.getCoinConfig(account.currency.id);
  const hash = await broadcastLogic(config, signature, account.currency.id);
  if (!hash) {
    throw new Error("concordium: broadcast returned no transaction id");
  }
  return patchOperationWithHash(operation, hash);
};
