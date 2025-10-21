import {
  AlpacaApi,
  Block,
  BlockInfo,
  Cursor,
  Page,
  Validator,
  FeeEstimation,
  Operation,
  Pagination,
  Reward,
  Stake,
  TransactionIntent,
  CraftedTransaction,
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
    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: number,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
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
    getValidators(_cursor?: Cursor): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported");
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
    minHeight: pagination.minHeight,
    order: pagination.order || "asc",
  } as const;
  return logicListOperations(address, options);
}
