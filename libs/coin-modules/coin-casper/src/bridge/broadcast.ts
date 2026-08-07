import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { AccountBridge } from "@ledgerhq/types-live";
import invariant from "invariant";
import { broadcast as logicBroadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { Transaction } from "../types";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  account,
  signedOperation: { signature, operation, rawData },
}) => {
  invariant(rawData, "casper: rawData is required");
  invariant(typeof rawData.tx === "string", "casper: rawData.tx is required and must be a string");
  const combinedTx = combine(rawData.tx, signature, account.freshAddress);

  const hash = await logicBroadcast(combinedTx);
  invariant(hash, "casper: failed to broadcast transaction and get transaction hash");

  const result = patchOperationWithHash(operation, hash);

  return result;
};
