import { type Api, type TransactionIntent } from "@ledgerhq/coin-framework/api/index";
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

export function createApi(config: SuiCoinConfig): Api<void> {
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

async function craft<T>(transactionIntent: TransactionIntent<T>): Promise<string> {
  const { unsigned } = await craftTransaction(transactionIntent);

  return Buffer.from(unsigned).toString("hex");
}
