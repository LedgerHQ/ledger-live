import { Transaction as HederaSDKTransaction } from "@hashgraph/sdk";
import { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { base64ToUrlSafeBase64 } from "./utils";
import { Transaction } from "./types";
import { broadcastTransaction } from "./api/network";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({ signedOperation }) => {
  const { signature, operation } = signedOperation;

  // NOTE: expecting a serialized transaction to be signedOperation.signature (in hex)
  const hederaTransaction = HederaSDKTransaction.fromBytes(Buffer.from(signature, "base64"));

  const response = await broadcastTransaction(hederaTransaction);

  const base64Hash = Buffer.from(response.transactionHash).toString("base64");
  const base64HashUrlSafe = base64ToUrlSafeBase64(base64Hash);

  return patchOperationWithHash(operation, base64HashUrlSafe);
};
