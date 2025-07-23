import {
  AlpacaApi,
  Block,
  BlockInfo,
  FeeEstimation,
  Operation,
  Pagination,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
import coinConfig, { type TronConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  listOperations as logicListOperations,
  lastBlock,
  Options,
} from "../logic";
import type { TronMemo } from "../types";

export function createApi(config: TronConfig): AlpacaApi<TronMemo> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine,
    craftTransaction,
    estimateFees: estimate,
    getBalance,
    lastBlock,
    listOperations,
    getBlock(_height): Promise<Block<TronAsset>> {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo(_height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
    },
  };
}

async function estimate(transactionIntent: TransactionIntent<TronMemo>): Promise<FeeEstimation> {
  const fees = await estimateFees(transactionIntent);
  return { value: fees };
}

async function listOperations(
  address: string,
  pagination: Pagination,
): Promise<[Operation[], string]> {
  const { minHeight } = pagination;
  const options: Options = {
    softLimit: 200,
    minHeight: minHeight,
    order: "asc",
  } as const;
  return logicListOperations(address, options);
}
