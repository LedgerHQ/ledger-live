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
import type { SuiApi, SuiTransactionIntent } from "./types";

export function createApi(config: SuiCoinConfig): SuiApi {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine,
    craftTransaction: craft,
    estimateFees,
    getBalance,
    lastBlock,
    listOperations,
  };
}

async function craft(transactionIntent: SuiTransactionIntent): Promise<string> {
  const { unsigned } = await craftTransaction(transactionIntent);

  return Buffer.from(unsigned).toString("hex");
}
