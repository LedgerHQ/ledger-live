import network from "@ledgerhq/live-network";
import { BigNumber } from "bignumber.js";
import type { AlgorandCoinConfig } from "../config";
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

const fullUrl = (config: AlgorandCoinConfig, route: string): string => `${config.node}${route}`;

export const getAccount = async (
  config: AlgorandCoinConfig,
  address: string,
): Promise<AlgoAccount> => {
  const { data } = await network<ExplorerAccount>({
    url: fullUrl(config, `/accounts/${address}`),
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

export const getTransactionParams = async (
  config: AlgorandCoinConfig,
): Promise<AlgoTransactionParams> => {
  const { data } = await network<ExplorerTransactionParams>({
    url: fullUrl(config, `/transactions/params`),
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

export const broadcastTransaction = async (
  config: AlgorandCoinConfig,
  payload: Buffer,
): Promise<string> => {
  const { data }: { data: AlgoTransactionBroadcastResponse } = await network<
    ExplorerBroadcastReturn,
    Buffer
  >({
    method: "POST",
    url: fullUrl(config, `/transactions`),
    data: payload,
    headers: { "Content-Type": "application/x-binary" },
  });

  return data.txId;
};

export const getBlock = async (
  config: AlgorandCoinConfig,
  round: number,
): Promise<ExplorerBlock> => {
  const { data } = await network<ExplorerBlock>({
    url: fullUrl(config, `/blocks/${round}`),
  });

  return data;
};
