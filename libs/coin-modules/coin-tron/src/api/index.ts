import {
  AlpacaApi,
  Block,
  BlockInfo,
  Cursor,
  Page,
  FeeEstimation,
  Operation,
  Pagination,
  Reward,
  Stake,
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
    getBlock(_height): Promise<Block> {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo(_height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
    },
    getStakes(_address: string, _cursor?: Cursor): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    getRewards(_address: string, _cursor?: Cursor): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
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
  const options: Options = {
    softLimit: 200,
    minHeight: pagination.minHeight || 0,
    order: pagination.order,
  } as const;
  return logicListOperations(address, options);
}
