import { Transaction as CasperTransaction, PublicKey } from "casper-js-sdk";
import { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { Transaction } from "../types";
import { broadcastTx } from "../api";
import invariant from "invariant";

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
