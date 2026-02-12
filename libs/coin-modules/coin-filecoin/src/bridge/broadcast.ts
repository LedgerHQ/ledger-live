import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { AccountBridge } from "@ledgerhq/types-live";
import { broadcastTx } from "../api";
import { getTxToBroadcast } from "../common-logic";
import { Transaction } from "../types";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({ signedOperation }) => {
  // log("debug", "[broadcast] start fn");
  const { signature, rawData } = signedOperation;
  const tx = getTxToBroadcast(signature, rawData!);

  const resp = await broadcastTx(tx);
  const { hash } = resp;

  const result = patchOperationWithHash(signedOperation.operation, hash);

  // log("debug", "[broadcast] finish fn");

  return result;
};
