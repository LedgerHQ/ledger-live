import type { TransactionResponse } from "@hashgraph/sdk";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { rpcClient } from "../network/rpc";
import { deserializeTransaction } from "./utils";

export const broadcast = async ({
  currency,
  txWithSignature,
}: {
  currency: CryptoCurrency;
  txWithSignature: string;
}): Promise<TransactionResponse> => {
  const transaction = deserializeTransaction(txWithSignature);
  return await rpcClient.broadcastTransaction({ currency, transaction });
};
