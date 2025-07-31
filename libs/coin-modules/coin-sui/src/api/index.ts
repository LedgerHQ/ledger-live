import coinConfig, { type SuiConfig } from "../config";
import {
  estimateFees,
  combine,
  broadcast,
  getBalance,
  listOperations,
  lastBlock,
  getBlock,
  getBlockInfo,
  craftTransaction,
} from "../logic";
import type { SuiAsset } from "./types";
import {
  AlpacaApi,
  FeeEstimation,
  Operation,
  Pagination,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";

export function createApi(config: SuiConfig): AlpacaApi<SuiAsset> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine,
    craftTransaction: craft,
    estimateFees: estimate,
    getBalance,
    lastBlock,
    getBlock,
    getBlockInfo,
    listOperations: list,
  };
}

async function craft(transactionIntent: TransactionIntent<SuiAsset>): Promise<string> {
  const { unsigned } = await craftTransaction(transactionIntent);

  return Buffer.from(unsigned).toString("hex");
}

async function estimate(transactionIntent: TransactionIntent<SuiAsset>): Promise<FeeEstimation> {
  const fees = await estimateFees(transactionIntent);
  return { value: fees };
}

async function list(
  address: string,
  pagination: Pagination,
): Promise<[Operation<SuiAsset>[], string]> {
  return listOperations(address, pagination);
}
