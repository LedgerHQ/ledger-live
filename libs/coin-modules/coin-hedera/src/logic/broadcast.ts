import type { TransactionResponse } from "@hashgraph/sdk";
import type { HederaCoinConfig } from "../config";
import { rpcClient } from "../network/rpc";
import { deserializeTransaction } from "./utils";

export const broadcast = async ({
  configOrCurrencyId,
  txWithSignature,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  txWithSignature: string;
}): Promise<TransactionResponse> => {
  const transaction = deserializeTransaction(txWithSignature);
  return await rpcClient.broadcastTransaction({ configOrCurrencyId, transaction });
};
