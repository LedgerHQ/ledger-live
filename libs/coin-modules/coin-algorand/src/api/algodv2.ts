import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network";
import { BigNumber } from "bignumber.js";
import {
  AlgoAccount,
  AlgoAsset,
  AlgoTransactionBroadcastResponse,
  AlgoTransactionParams,
} from "./algodv2.types";

const BASE_URL = getEnv("API_ALGORAND_BLOCKCHAIN_EXPLORER_API_ENDPOINT");
const NODE_URL = `${BASE_URL}/ps2/v2`;

const fullUrl = (route: string): string => `${NODE_URL}${route}`;

type ExplorerAccount = {
  assets: {
    "asset-id": number;
    amount: number;
  }[];
  round: number;
  address: string;
  amount: number;
  "pending-rewards": number;
};

export const getAccount = async (address: string): Promise<AlgoAccount> => {
  const { data } = await network<ExplorerAccount>({
    url: fullUrl(`/accounts/${address}`),
  });

  const assets: AlgoAsset[] = data.assets
    ? // FIXME: what is the type of `a`?
      data.assets.map((a): AlgoAsset => {
        return {
          assetId: a["asset-id"].toString(),
          balance: new BigNumber(a.amount),
        };
      })
    : [];

  return {
    round: data.round,
    address: data.address,
    balance: new BigNumber(data.amount),
    pendingRewards: new BigNumber(data["pending-rewards"]),
    assets,
  };
};

type ExplorerTransactioParams = {
  "consensus-version": string;
  fee: number;
  "genesis-hash": string;
  "genesis-id": string;
  "first-round"?: number;
  "last-round": number;
  "min-fee": number;
};

export const getTransactionParams = async (): Promise<AlgoTransactionParams> => {
  const { data } = await network<ExplorerTransactioParams>({
    url: fullUrl(`/transactions/params`),
  });

  return {
    fee: data["fee"],
    minFee: data["min-fee"],
    firstRound: data["first-round"] ?? 0,
    lastRound: data["last-round"],
    genesisID: data["genesis-id"],
    genesisHash: data["genesis-hash"],
  };
};

type ExplorerBroadcastReturn = { txId: string };

export const broadcastTransaction = async (payload: Buffer): Promise<string> => {
  const { data }: { data: AlgoTransactionBroadcastResponse } = await network<
    ExplorerBroadcastReturn,
    Buffer
  >({
    method: "POST",
    url: fullUrl(`/transactions`),
    data: payload,
    headers: { "Content-Type": "application/x-binary" },
  });

  return data.txId;
};
