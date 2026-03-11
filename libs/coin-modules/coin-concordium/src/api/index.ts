import type {
  AlpacaApi,
  CraftedTransaction,
  Cursor,
  FeeEstimation,
  ListOperationsOptions,
  Page,
  Reward,
  Stake,
  TransactionIntent,
  Validator,
} from "@ledgerhq/coin-framework/api/index";
import BigNumber from "bignumber.js";
import {
  serializeTransfer,
  serializeTransferWithMemo,
  TransactionType,
} from "@ledgerhq/concordium-core";
import {
  broadcast,
  combine,
  craftTransaction as craftTransactionLogic,
  craftRawTransaction,
  estimateFees as estimateFeesLogic,
  getBalance,
  getBlock,
  getBlockInfo,
  getNextValidSequence,
  lastBlock,
  listOperations,
} from "../logic";
import coinConfig from "../config";
import type { ConcordiumConfig, ConcordiumMemo } from "../types";

export function createApi(config: ConcordiumConfig, currencyId: string): AlpacaApi<ConcordiumMemo> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast: (tx: string) => broadcast(tx, currencyId),
    combine,
    craftTransaction: (transactionIntent: TransactionIntent<ConcordiumMemo>) =>
      craftTransaction(transactionIntent, currencyId),
    craftRawTransaction,
    estimateFees: (transactionIntent: TransactionIntent<ConcordiumMemo>) =>
      estimateFees(transactionIntent, currencyId),
    getBalance: (address: string) => getBalance(address, currencyId),
    lastBlock: () => lastBlock(currencyId),
    listOperations: (address: string, options: ListOperationsOptions) =>
      listOperations(address, options, currencyId),
    getBlock: (height: number) => getBlock(height, currencyId),
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
