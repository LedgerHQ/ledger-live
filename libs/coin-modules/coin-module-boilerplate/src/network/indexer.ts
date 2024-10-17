import { AccountTxResponse } from "./types";
import network from "@ledgerhq/live-network/network";
import { getEnv } from "@ledgerhq/live-env";

export const getTransactions = async (
  address: string,
  params: { from: number; size: number },
): Promise<AccountTxResponse["transactions"]> => {
  const { data } = await network<AccountTxResponse>({
    url: `${getEnv("INDEXER_BOILERPLATE")}/account/${address}/transactions`,
    method: "GET",
  });

  return data.transactions;
};
