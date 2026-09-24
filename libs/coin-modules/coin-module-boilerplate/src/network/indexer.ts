import { Cursor } from "@ledgerhq/coin-module-framework/api/types";
import network from "@ledgerhq/live-network/network";
import type { BoilerplateCoinConfig } from "../config";
import { AccountTxResponse } from "./types";

export const getTransactions = async (
  config: BoilerplateCoinConfig,
  address: string,
  params: {
    minHeight: number;
    cursor?: Cursor | undefined;
    limit?: number;
    order?: "asc" | "desc";
  },
): Promise<AccountTxResponse["transactions"]> => {
  const { data } = await network<AccountTxResponse>({
    url: `${config.infra.INDEXER_BOILERPLATE}/account/${address}/transactions`,
    params,
    method: "GET",
  });

  return data.transactions;
};
