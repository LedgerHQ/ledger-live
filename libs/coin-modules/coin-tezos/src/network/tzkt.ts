import URL from "url";
import { log } from "@ledgerhq/logs";
import network from "@ledgerhq/live-network";
import coinConfig from "../config";
import { APIAccount, APIBlock, APIOperation } from "./types";

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
  async getAccountOperations(
    address: string,
    query: {
      lastId?: number;
      sort?: number;
    },
  ): Promise<APIOperation[]> {
    const { data } = await network<APIOperation[]>({
      url: URL.format({
        pathname: `${getExplorerUrl()}/v1/accounts/${address}/operations`,
        query,
      }),
    });
    return data;
  },
};

export const fetchAllTransactions = async (
  address: string,
  lastId?: number,
): Promise<APIOperation[]> => {
  let ops: APIOperation[] = [];
  let maxIteration = coinConfig.getCoinConfig().explorer.maxTxQuery;
  do {
    const newOps = await api.getAccountOperations(address, { lastId, sort: 0 });
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
