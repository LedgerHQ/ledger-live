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
import type {
  AlpacaApi,
  FeeEstimation,
  Operation,
  Pagination,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";

export function createApi(config: SuiConfig): AlpacaApi {
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

async function craft(transactionIntent: TransactionIntent): Promise<string> {
  const { unsigned } = await craftTransaction(transactionIntent);

  return Buffer.from(unsigned).toString("hex");
}

async function estimate(transactionIntent: TransactionIntent): Promise<FeeEstimation> {
  const fees = await estimateFees(transactionIntent);
  return { value: fees };
}

async function list(address: string, pagination: Pagination): Promise<[Operation[], string]> {
  return listOperations(address, pagination);
}
