import type { TransactionResponse } from "@hashgraph/sdk";
import { rpcClient } from "../network/rpc";
import { deserializeTransaction } from "./utils";

export const broadcast = async (txWithSignature: string): Promise<TransactionResponse> => {
  const hederaTransaction = deserializeTransaction(txWithSignature);
  return await rpcClient.broadcastTransaction(hederaTransaction);
};
