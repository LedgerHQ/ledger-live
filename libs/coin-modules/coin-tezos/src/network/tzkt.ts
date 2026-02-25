import URL from "url";
import network from "@ledgerhq/live-network";
import { log } from "@ledgerhq/logs";
import coinConfig from "../config";
import { APIAccount, APIBlock, APIOperation, AccountsGetOperationsOptions } from "./types";

const getExplorerUrl = () => coinConfig.getCoinConfig().explorer.url;

const api = {
  async getBlockCount(): Promise<number> {
    const { data } = await network<number>({
      url: `${getExplorerUrl()}/v1/blocks/count`,
    });
    return data;
  },
  async getLastBlock(): Promise<{ hash: string; level: number; date: Date }> {
    const { data } = await network<APIBlock[]>({
      url: `${getExplorerUrl()}/v1/blocks`,
      params: {
        "sort.desc": "level",
      },
    });

    return {
      hash: data[0].hash,
      level: data[0].level,
      date: new Date(data[0].timestamp),
    };
  },
  async getAccountByAddress(address: string): Promise<APIAccount> {
    const { data } = await network<APIAccount>({
      url: `${getExplorerUrl()}/v1/accounts/${address}`,
    });
    return data;
  },
  // https://api.tzkt.io/#operation/Accounts_GetOperations
  async getAccountOperations(
    address: string,
    query: AccountsGetOperationsOptions,
  ): Promise<APIOperation[]> {
    // Remove undefined from query
    Object.entries(query).forEach(
      ([key, value]) => value === undefined && delete query[key as keyof typeof query],
    );
    const { data } = await network<APIOperation[]>({
      url: URL.format({
        pathname: `${getExplorerUrl()}/v1/accounts/${address}/operations`,
        query,
      }),
    });
    return data;
  },
};

// TODO this has same purpose as api/listOperations
export const fetchAllTransactions = async (
  address: string,
  lastId?: number,
): Promise<APIOperation[]> => {
  let ops: APIOperation[] = [];
  let maxIteration = coinConfig.getCoinConfig().explorer.maxTxQuery;
  do {
    const newOps = await api.getAccountOperations(address, {
      lastId,
      sort: "Ascending",
      "level.ge": 0,
    });
    if (newOps.length === 0) return ops;
    ops = ops.concat(newOps);
    const last = ops[ops.length - 1];
    if (!last) return ops;
    lastId = last.id;
    if (!lastId) {
      log("tezos", "id missing!");
      return ops;
    }
  } while (--maxIteration);
  return ops;
};

export default api;
