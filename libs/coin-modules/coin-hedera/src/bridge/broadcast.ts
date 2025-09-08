import { AccountBridge, Operation } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { base64ToUrlSafeBase64, patchOperationWithExtra } from "./utils";
import { HederaOperationExtra, Transaction } from "../types";
import { isValidExtra } from "../logic";
import { broadcast as logicBroadcast } from "../logic/broadcast";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({ signedOperation }) => {
  const { signature, operation } = signedOperation;
  const response = await logicBroadcast(signature);

  const base64Hash = Buffer.from(response.transactionHash).toString("base64");
  const base64HashUrlSafe = base64ToUrlSafeBase64(base64Hash);
  const extra: HederaOperationExtra = {
    ...(isValidExtra(operation.extra) ? operation.extra : {}),
    transactionId: response.transactionId.toString(),
  };

  let patchedOperation: Operation = operation;
  patchedOperation = patchOperationWithHash(patchedOperation, base64HashUrlSafe);
  patchedOperation = patchOperationWithExtra(patchedOperation, extra);

  return patchedOperation;
};
