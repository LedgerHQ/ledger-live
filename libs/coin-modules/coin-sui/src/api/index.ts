import coinConfig, { type SuiConfig } from "../config";
import {
  estimateFees,
  combine,
  broadcast,
  getBalance,
  listOperations as logicListOperations,
  lastBlock,
  getBlock,
  getBlockInfo,
  craftTransaction,
  getStakes,
  getRewards,
} from "../logic";
import {
  AlpacaApi,
  CraftedTransaction,
  FeeEstimation,
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
    listOperations: logicListOperations,
    getStakes,
    getRewards,
  };
}

async function craft(transactionIntent: TransactionIntent): Promise<CraftedTransaction> {
  const { unsigned } = await craftTransaction(transactionIntent);

  return { transaction: Buffer.from(unsigned).toString("hex") };
}

async function estimate(transactionIntent: TransactionIntent): Promise<FeeEstimation> {
  const fees = await estimateFees(transactionIntent);
  return { value: fees };
}
