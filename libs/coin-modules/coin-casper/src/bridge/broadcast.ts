import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction as CasperTransaction } from "casper-js-sdk";
import invariant from "invariant";
import { combine } from "../logic/combine";
import { broadcastTx } from "../network/api";
import { Transaction } from "../types";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  account,
  signedOperation: { signature, operation, rawData },
}) => {
  invariant(rawData, "casper: rawData is required");
  invariant(typeof rawData.tx === "string", "casper: rawData.tx is required and must be a string");
  const combinedTx = combine(rawData.tx, signature, account.freshAddress);
  const tx = CasperTransaction.fromJSON(combinedTx);

  const hash = await broadcastTx(tx);
  invariant(hash, "casper: failed to broadcast transaction and get transaction hash");

  const result = patchOperationWithHash(operation, hash);

  return result;
};
