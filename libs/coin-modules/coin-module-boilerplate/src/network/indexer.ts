import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import { AccountTxResponse } from "./types";

export const getTransactions = async (
  address: string,
  params: { from: number; size?: number },
): Promise<AccountTxResponse["transactions"]> => {
  const { data } = await network<AccountTxResponse>({
    // NOTE: add INDEXER_BOILERPLATE to libs/env/src/env.ts
    // @ts-expect-error: add INDEXER_BOILERPLATE to libs/env/src/env.ts
    url: `${getEnv("INDEXER_BOILERPLATE")}/account/${address}/transactions`,
    params,
    method: "GET",
  });

  return data.transactions;
};
