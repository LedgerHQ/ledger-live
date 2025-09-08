import { Transaction as HederaSDKTransaction, TransactionResponse } from "@hashgraph/sdk";
import { broadcastTransaction } from "../network/network";

export const broadcast = async (txWithSignature: string): Promise<TransactionResponse> => {
  const hederaTransaction = HederaSDKTransaction.fromBytes(Buffer.from(txWithSignature, "hex"));
  const response = await broadcastTransaction(hederaTransaction);

  return response;
};
