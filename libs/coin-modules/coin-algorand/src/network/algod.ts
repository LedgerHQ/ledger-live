import network from "@ledgerhq/live-network";
import { BigNumber } from "bignumber.js";
import coinConfig from "../config";
import type {
  AlgoAccount,
  AlgoAsset,
  AlgoTransactionBroadcastResponse,
  AlgoTransactionParams,
  ExplorerAccount,
  ExplorerTransactionParams,
  ExplorerBroadcastReturn,
  ExplorerBlock,
} from "./types";

const getNodeUrl = (): string => coinConfig.getCoinConfig().node;

const fullUrl = (route: string): string => `${getNodeUrl()}${route}`;

export const getAccount = async (address: string): Promise<AlgoAccount> => {
  const { data } = await network<ExplorerAccount>({
    url: fullUrl(`/accounts/${address}`),
  });

  const assets: AlgoAsset[] = data.assets
    ? data.assets.map((a): AlgoAsset => {
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

export const getTransactionParams = async (): Promise<AlgoTransactionParams> => {
  const { data } = await network<ExplorerTransactionParams>({
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

export const getBlock = async (round: number): Promise<ExplorerBlock> => {
  const { data } = await network<ExplorerBlock>({
    url: fullUrl(`/blocks/${round}`),
  });

  return data;
};
