import { AccountTxResponse } from "./types";
import network from "@ledgerhq/live-network/network";
import { getEnv } from "@ledgerhq/live-env";

export const getTransactions = async (
  address: string,
  params: { from: number; size: number },
): Promise<AccountTxResponse["transactions"]> => {
  const { data } = await network<AccountTxResponse>({
    // NOTE: add INDEXER_BOILERPLATE to libs/env/src/env.ts
    // @ts-expect-error: add INDEXER_BOILERPLATE to libs/env/src/env.ts
    url: `${getEnv("INDEXER_BOILERPLATE")}/account/${address}/transactions`,
    method: "GET",
  });

  return data.transactions;
};
