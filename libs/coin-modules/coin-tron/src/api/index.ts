import {
  AlpacaApi,
  Cursor,
  ListOperationsOptions,
  Page,
  Validator,
  FeeEstimation,
  Operation,
  Reward,
  Stake,
  TransactionIntent,
  CraftedTransaction,
  TransactionValidation,
  Balance,
} from "@ledgerhq/coin-module-framework/api/index";
import coinConfig, { type TronConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  getBlock,
  getBlockInfo,
  listOperations as listOperationsLogic,
  lastBlock,
  validateAddress,
} from "../logic";
import { defaultFetchParams, getBlock as getBlockNetwork } from "../network";
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
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: estimate,
    getBalance,
    lastBlock,
    listOperations,
    getBlock,
    getBlockInfo,
    getStakes(_address: string, _cursor?: Cursor): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    getRewards(_address: string, _cursor?: Cursor): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    getValidators(_cursor?: Cursor): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported");
    },
    validateIntent: async (
      _transactionIntent: TransactionIntent,
      _balances: Balance[],
      _customFees?: FeeEstimation,
    ): Promise<TransactionValidation> => {
      throw new Error("validateIntent is not supported");
    },
    getNextSequence: async (_address: string) => {
      throw new Error("getNextSequence is not supported");
    },
    validateAddress,
  };
}

async function estimate(transactionIntent: TransactionIntent<TronMemo>): Promise<FeeEstimation> {
  const fees = await estimateFees(transactionIntent);
  return { value: fees };
}

async function listOperations(
  address: string,
  { minHeight, order, cursor, limit }: ListOperationsOptions,
): Promise<Page<Operation>> {
  if (limit !== undefined && limit > 200) {
    throw new Error("limit must be <= 200 for Tron (TronGrid API restriction)");
  }
  const effectiveLimit = limit ?? 200;
  const effectiveOrder = order ?? "asc";

  let minTimestamp = defaultFetchParams.minTimestamp;
  if (minHeight > 0) {
    const block = await getBlockNetwork(minHeight);
    minTimestamp = block.time?.getTime() ?? defaultFetchParams.minTimestamp;
  }

  return listOperationsLogic(address, {
    limit: effectiveLimit,
    minTimestamp,
    order: effectiveOrder,
    cursor,
  });
}
