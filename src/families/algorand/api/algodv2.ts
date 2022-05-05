import { BigNumber } from "bignumber.js";
import { getEnv } from "../../../env";
import network from "../../../network";
import {
  AlgoAccount,
  AlgoAsset,
  AlgoTransactionParams,
  AlgoTransactionBroadcastResponse,
} from "./algodv2.types";

const BASE_URL = getEnv("API_ALGORAND_BLOCKCHAIN_EXPLORER_API_ENDPOINT");
const NODE_URL = `${BASE_URL}/ps2/v2`;

const fullUrl = (route: string): string => `${NODE_URL}${route}`;

export const getAccount = async (address: string): Promise<AlgoAccount> => {
  const { data } = await network({
    method: "GET",
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

export const getTransactionParams =
  async (): Promise<AlgoTransactionParams> => {
    const { data } = await network({
      method: "GET",
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

export const broadcastTransaction = async (
  payload: Buffer
): Promise<string> => {
  const { data }: { data: AlgoTransactionBroadcastResponse } = await network({
    method: "POST",
    url: fullUrl(`/transactions`),
    data: payload,
    headers: { "Content-Type": "application/x-binary" },
  });

  return data.txId;
};
