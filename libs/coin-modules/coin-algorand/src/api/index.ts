import {
  Api,
  Block,
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
import { isSendTransactionIntent } from "@ledgerhq/coin-framework/utils";
import coinConfig, { type AlgorandCoinConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  getBlockInfo,
  lastBlock,
  listOperations,
  validateIntent,
} from "../logic";
import type { AlgorandMemo, ListOperationsOptions } from "../types";

export function createApi(config: AlgorandCoinConfig): Api<AlgorandMemo> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine,
    craftTransaction: craft,
    craftRawTransaction,
    estimateFees: estimate,
    getBalance,
    getBlockInfo,
    lastBlock,
    listOperations: operations,
    validateIntent,
    getBlock(_height: number): Promise<Block> {
      throw new Error("getBlock is not supported for Algorand");
    },
    getSequence(_address: string): Promise<bigint> {
      // Algorand doesn't use sequence numbers like account-based chains
      // It uses rounds (block heights) for transaction validity windows
      throw new Error("getSequence is not applicable for Algorand");
    },
    getStakes(_address: string, _cursor?: Cursor): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported for Algorand");
    },
    getRewards(_address: string, _cursor?: Cursor): Promise<Page<Reward>> {
      // Note: Algorand has pending rewards but no staking in the traditional sense
      throw new Error("getRewards is not supported for Algorand");
    },
    getValidators(_cursor?: Cursor): Promise<Page<Validator>> {
      // Algorand uses Proof of Stake but doesn't expose validators in the same way
      throw new Error("getValidators is not supported for Algorand");
    },
  };
}

async function craft(
  transactionIntent: TransactionIntent<AlgorandMemo>,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  if (!isSendTransactionIntent(transactionIntent)) {
    throw new Error("Only send transaction intent is supported");
  }

  const fees = customFees?.value ?? (await estimateFees()).value;

  // Extract memo if present
  const memo = transactionIntent.memo?.type === "string" ? transactionIntent.memo.value : undefined;

  // Determine if this is a token transfer
  const assetId =
    transactionIntent.asset.type === "asa" ? transactionIntent.asset.assetReference : undefined;

  const result = await craftTransaction({
    sender: transactionIntent.sender,
    recipient: transactionIntent.recipient,
    amount: transactionIntent.amount,
    memo,
    assetId,
    fees,
  });

  return {
    transaction: result.serializedTransaction,
    details: {
      txPayload: result.txPayload,
    },
  };
}

async function craftRawTransaction(
  _transaction: string,
  _sender: string,
  _publicKey: string,
  _sequence: bigint,
): Promise<CraftedTransaction> {
  // Algorand doesn't need this pattern as transactions are crafted with all required params
  throw new Error("craftRawTransaction is not supported for Algorand");
}

async function estimate(
  _transactionIntent: TransactionIntent<AlgorandMemo>,
  _customFeesParameters?: FeeEstimation["parameters"],
): Promise<FeeEstimation> {
  // For Algorand, fees are determined by transaction size
  // Since we don't have the full transaction yet, estimate with average size
  return estimateFees();
}

async function operations(address: string, pagination: Pagination): Promise<[Operation[], string]> {
  const options: ListOperationsOptions = {
    minHeight: pagination.minHeight,
    order: pagination.order ?? "asc",
  };

  if (pagination.limit) {
    options.limit = pagination.limit;
  }

  if (pagination.lastPagingToken) {
    options.token = pagination.lastPagingToken;
  }

  const [ops, token] = await listOperations(address, options);
  // Cast to base Operation type as expected by Api interface
  return [ops as unknown as Operation[], token];
}
