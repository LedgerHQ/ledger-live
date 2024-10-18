import { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { getTxToBroadcast } from "./utils/utils";
import { broadcastTx } from "./api";
import { Transaction } from "./types";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({ signedOperation }) => {
  // log("debug", "[broadcast] start fn");
  const { operation, signature, rawData } = signedOperation;
  const tx = getTxToBroadcast(operation, signature, rawData!);

  const resp = await broadcastTx(tx);
  const { hash } = resp;

  const result = patchOperationWithHash(signedOperation.operation, hash);

  // log("debug", "[broadcast] finish fn");

  return result;
};
