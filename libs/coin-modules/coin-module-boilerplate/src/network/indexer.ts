import { Cursor } from "@ledgerhq/coin-module-framework/api/types";
import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import { AccountTxResponse } from "./types";

export const getTransactions = async (
  address: string,
  params: {
    minHeight: number;
    cursor?: Cursor | undefined;
    limit?: number;
    order?: "asc" | "desc";
  },
): Promise<AccountTxResponse["transactions"]> => {
  const { data } = await network<AccountTxResponse>({
    url: `${getEnv("INDEXER_BOILERPLATE")}/account/${address}/transactions`,
    params,
    method: "GET",
  });

  return data.transactions;
};
