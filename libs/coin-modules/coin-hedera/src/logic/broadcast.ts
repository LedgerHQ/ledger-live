import type { TransactionResponse } from "@hashgraph/sdk";
import { hederaClient } from "../network/client";
import { deserializeTransaction } from "./utils";

export const broadcast = async (txWithSignature: string): Promise<TransactionResponse> => {
  const hederaTransaction = deserializeTransaction(txWithSignature);
  const response = await hederaClient.broadcastTransaction(hederaTransaction);

  return response;
};
