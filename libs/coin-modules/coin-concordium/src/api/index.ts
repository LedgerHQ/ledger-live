import {
  AlpacaApi,
  CraftedTransaction,
  Cursor,
  FeeEstimation,
  Page,
  Reward,
  Stake,
  TransactionIntent,
  Validator,
} from "@ledgerhq/coin-framework/api/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import {
  serializeTransfer,
  serializeTransferWithMemo,
} from "@ledgerhq/hw-app-concordium/lib/serialization";
import { TransactionType } from "@ledgerhq/hw-app-concordium/lib/types";
import { encodeMemoToCbor } from "@ledgerhq/hw-app-concordium/lib/cbor";
import {
  broadcast as broadcastLogic,
  combine,
  craftTransaction as craftTransactionLogic,
  craftRawTransaction as craftRawTransactionLogic,
  estimateFees as estimateFeesLogic,
  getBalance,
  getBlock as getBlockLogic,
  getBlockInfo as getBlockInfoLogic,
  getNextValidSequence,
  lastBlock,
  listOperations,
} from "../logic";
import coinConfig from "../config";
import type { ConcordiumConfig, ConcordiumMemo } from "../types";

export function createApi(config: ConcordiumConfig): AlpacaApi<ConcordiumMemo> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));
  const currency = getCryptoCurrencyById("concordium");

  return {
    broadcast: (tx: string) => broadcastLogic(tx, currency),
    combine,
    craftTransaction: (transactionIntent: TransactionIntent<ConcordiumMemo>) =>
      craftTransaction(transactionIntent, currency),
    craftRawTransaction,
    estimateFees: (transactionIntent: TransactionIntent<ConcordiumMemo>) =>
      estimateFees(transactionIntent, currency),
    getBalance: (address: string) => getBalance(address, currency),
    lastBlock: () => lastBlock(currency),
    listOperations: (address: string, pagination) => listOperations(address, pagination, currency),
    getBlock: (height: number) => getBlockLogic(height, currency),
    getBlockInfo: (height: number) => getBlockInfoLogic(height, currency),
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
  currency: CryptoCurrency,
): Promise<CraftedTransaction> {
  const nextSequenceNumber = await getNextValidSequence(transactionIntent.sender, currency);
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

async function craftRawTransaction(
  transaction: string,
  sender: string,
  publicKey: string,
  sequence: bigint,
): Promise<CraftedTransaction> {
  const { serializedTransaction } = await craftRawTransactionLogic(
    transaction,
    sender,
    publicKey,
    sequence,
  );
  return { transaction: serializedTransaction };
}

async function estimateFees(
  transactionIntent: TransactionIntent<ConcordiumMemo>,
  currency: CryptoCurrency,
): Promise<FeeEstimation> {
  const memo =
    "memo" in transactionIntent && transactionIntent.memo?.type === "string"
      ? transactionIntent.memo.value
      : undefined;

  const transactionType = memo ? TransactionType.TransferWithMemo : TransactionType.Transfer;

  const memoSize = memo ? encodeMemoToCbor(memo).length : undefined;

  const estimation = await estimateFeesLogic(currency, transactionType, memoSize);

  return { value: estimation.cost };
}
