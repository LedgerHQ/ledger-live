import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction as CasperTransaction, PublicKey } from "casper-js-sdk";
import invariant from "invariant";
import { broadcastTx } from "../api";
import { Transaction } from "../types";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  account,
  signedOperation: { signature, operation, rawData },
}) => {
  invariant(rawData, "casper: rawData is required");
  const tx = CasperTransaction.fromJSON(rawData.tx);
  tx.setSignature(Buffer.from(signature, "hex"), PublicKey.fromHex(account.freshAddress));

  const hash = await broadcastTx(tx);
  invariant(hash, "casper: failed to broadcast transaction and get transaction hash");

  const result = patchOperationWithHash(operation, hash);

  return result;
};
