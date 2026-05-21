import type {
  CoinModuleApi,
  Balance,
  BalanceOptions,
  CraftedTransaction,
  Cursor,
  FeeEstimation,
  ListOperationsOptions,
  Operation,
  Page,
  Reward,
  Stake,
  TransactionIntent,
  TransactionValidation,
  Validator,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import {
  serializeTransfer,
  serializeTransferWithMemo,
  TransactionType,
} from "@ledgerhq/concordium-core";
import BigNumber from "bignumber.js";
import { validateAddress } from "../bridge/validateAddress";
import coinConfig from "../config";
import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  broadcast,
  combine,
  craftRawTransaction,
  craftTransaction as craftTransactionLogic,
  estimateFees as estimateFeesLogic,
  getBalance,
  getBlockInfo,
  getNextValidSequence,
  lastBlock,
  listOperations as listOperationsLogic,
} from "../logic";
import type { ConcordiumConfig, ConcordiumMemo } from "../types";
import { mapRawOperationToApiOperation } from "./utils";

export function createApi(config: ConcordiumConfig, currencyId: string): CoinModuleApi<ConcordiumMemo> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast: (tx: string) => broadcast(tx, currencyId),
    combine,
    craftTransaction: (transactionIntent: TransactionIntent<ConcordiumMemo>) =>
      craftTransaction(transactionIntent, currencyId),
    craftRawTransaction,
    estimateFees: (transactionIntent: TransactionIntent<ConcordiumMemo>) =>
      estimateFees(transactionIntent, currencyId),
    getBalance: (address: string, options?: BalanceOptions) =>
      rejectBalanceOptions(() => getBalance(address, currencyId), options),
    lastBlock: () => lastBlock(currencyId),
    listOperations: (address: string, options: ListOperationsOptions) =>
      listOperations(address, options, currencyId),
    getBlock: (_height: number) => {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo: (height: number) => getBlockInfo(height, currencyId),
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
    craftTransactionData,
  };
}

async function craftTransaction(
  transactionIntent: TransactionIntent<ConcordiumMemo>,
  currencyId: string,
): Promise<CraftedTransaction> {
  const nextSequenceNumber = await getNextValidSequence(transactionIntent.sender, currencyId);
  const memo =
    "memo" in transactionIntent && transactionIntent.memo?.type === "string"
      ? transactionIntent.memo.value
      : undefined;
  const structuredTransaction = await craftTransactionLogic(
    { address: transactionIntent.sender, nextSequenceNumber },
    {
      recipient: transactionIntent.recipient,
      amount: new BigNumber(transactionIntent.amount.toString()),
      ...(memo ? { memo } : {}),
    },
  );
  const serialized =
    structuredTransaction.type === TransactionType.TransferWithMemo
      ? serializeTransferWithMemo(structuredTransaction)
      : serializeTransfer(structuredTransaction);
  return { transaction: serialized.toString("hex") };
}

async function estimateFees(
  transactionIntent: TransactionIntent<ConcordiumMemo>,
  currencyId: string,
): Promise<FeeEstimation> {
  const memo =
    "memo" in transactionIntent && transactionIntent.memo?.type === "string"
      ? transactionIntent.memo.value
      : undefined;

  const estimation = await estimateFeesLogic(currencyId, memo);

  return { value: estimation.cost };
}

async function listOperations(
  address: string,
  options: ListOperationsOptions,
  currencyId: string,
): Promise<Page<Operation>> {
  const { items, next } = await listOperationsLogic(address, options, currencyId);

  return {
    items: items.map(mapRawOperationToApiOperation),
    next,
  };
}
