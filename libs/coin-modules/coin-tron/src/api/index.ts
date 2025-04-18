import type { Api, FeeEstimation, TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import coinConfig, { type TronConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  listOperations,
  lastBlock,
} from "../logic";
import type { TronAsset } from "../types";

export function createApi(config: TronConfig): Api<TronAsset> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine,
    craftTransaction,
    estimateFees: estimate,
    getBalance,
    lastBlock,
    listOperations,
  };
}

async function estimate(transactionIntent: TransactionIntent<TronAsset>): Promise<FeeEstimation> {
  const fees = await estimateFees(transactionIntent);
  return {
    value: fees,
  };
}
