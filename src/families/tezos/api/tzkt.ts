// @flow
import URL from "url";
import { getEnv } from "../../../env";
import network from "../../../network";

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

export type APIOperation =
  | (CommonOperationType & {
      type: "transaction";
      amount: number;
      initiator: { address: string } | undefined | null;
      sender: { address: string } | undefined | null;
      target: { address: string } | undefined | null;
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

const api = {
  async getBlockCount(): Promise<number> {
    const { data } = await network({
      method: "GET",
      url: `${getEnv("API_TEZOS_TZKT_API")}/v1/blocks/count`,
    });
    return data;
  },
  async getAccountByAddress(address: string): Promise<APIAccount> {
    const { data } = await network({
      method: "GET",
      url: `${getEnv("API_TEZOS_TZKT_API")}/v1/accounts/${address}`,
    });
    return data;
  },
  async getAccountOperations(
    address: string,
    query: {
      lastId?: number;
      sort?: number;
    }
  ): Promise<APIOperation[]> {
    const { data } = await network({
      method: "GET",
      url: URL.format({
        pathname: `${getEnv(
          "API_TEZOS_TZKT_API"
        )}/v1/accounts/${address}/operations`,
        query,
      }),
    });
    return data;
  },
};

export default api;
