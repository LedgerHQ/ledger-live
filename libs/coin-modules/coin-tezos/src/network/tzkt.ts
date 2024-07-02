import URL from "url";
import { log } from "@ledgerhq/logs";
import network from "@ledgerhq/live-network";
import coinConfig from "../config";

type APIAccount =
  | {
      type: "empty";
      address: string;
      counter: number;
    }
  | {
      type: "user";
      address: string;
      publicKey: string;
      revealed: boolean;
      balance: number;
      counter: number;
      delegate?: {
        alias: string;
        address: string;
        active: boolean;
      };
      delegationLevel: number;
      delegationTime: string;
      numTransactions: number;
      firstActivityTime: string;
    };

type CommonOperationType = {
  id: number;
  hash?: string;
  storageFee?: number;
  allocationFee?: number;
  bakerFee?: number;
  timestamp: string;
  level: number;
  block: string;
  gasLimit?: number;
  storageLimit?: number;
  status?: "applied" | "failed" | "backtracked" | "skipped";
};

/**
 * Source: https://api.tzkt.io/#operation/Accounts_GetOperations
 */
export type APIOperation =
  | (CommonOperationType & {
      type: "transaction";
      amount: number;
      initiator: { address: string } | undefined | null;
      sender: { address: string } | undefined | null;
      target: { address: string } | undefined | null;
      counter: number;
    })
  | (CommonOperationType & {
      type: "reveal";
    })
  | (CommonOperationType & {
      type: "delegation";
      prevDelegate: { address: string } | undefined | null;
      newDelegate: { address: string } | undefined | null;
    })
  | (CommonOperationType & {
      type: "activation";
      balance: number;
    })
  | (CommonOperationType & {
      type: "origination";
      contractBalance: number;
      originatedContract: {
        address: string;
      };
    })
  | (CommonOperationType & {
      type: "migration";
      balanceChange: number;
    })
  | (CommonOperationType & {
      type: ""; // this is to express fact we have others and we need to always filter out others
    });

const getExplorerUrl = () => coinConfig.getCoinConfig().explorer.url;

const api = {
  async getBlockCount(): Promise<number> {
    const { data } = await network<number>({
      url: `${getExplorerUrl()}/v1/blocks/count`,
    });
    return data;
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
