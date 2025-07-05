import coinConfig, { type SuiCoinConfig } from "../config";
import {
  estimateFees,
  combine,
  broadcast,
  getBalance,
  listOperations,
  lastBlock,
  craftTransaction,
} from "../logic";
import type {
  AlpacaApi,
  FeeEstimation,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";

export function createApi(config: SuiCoinConfig): AlpacaApi {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine,
    craftTransaction: craft,
    estimateFees: estimate,
    getBalance,
    lastBlock,
    listOperations,
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
