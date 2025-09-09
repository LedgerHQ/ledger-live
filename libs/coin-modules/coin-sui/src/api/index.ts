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
  getStakes,
  getRewards,
} from "../logic";
import {
  AlpacaApi,
  CraftedTransaction,
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
    getStakes,
    getRewards,
  };
}

async function craft(transactionIntent: TransactionIntent): Promise<CraftedTransaction> {
  const { unsigned, objects } = await craftTransaction(transactionIntent, true);

  return {
    transaction: Buffer.from(unsigned).toString("hex"),
    details: {
      objects: objects?.map(obj => Buffer.from(obj).toString("hex")),
    },
  };
}

async function estimate(transactionIntent: TransactionIntent): Promise<FeeEstimation> {
  const fees = await estimateFees(transactionIntent);
  return { value: fees };
}

async function list(address: string, pagination: Pagination): Promise<[Operation[], string]> {
  return listOperations(address, pagination);
}
