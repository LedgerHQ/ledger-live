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
} from "../common-logic";
import coinConfig from "../config";
import type { ConcordiumConfig } from "../types/config";
import type { ConcordiumMemo } from "../types/memo";

export function createApi(config: ConcordiumConfig, currencyId: string): AlpacaApi<ConcordiumMemo> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));
  const currency = getCryptoCurrencyById(currencyId);

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
  const { serializedTransaction } = await craftTransactionLogic(
    { address: transactionIntent.sender, nextSequenceNumber },
    {
      recipient: transactionIntent.recipient,
      amount: new BigNumber(transactionIntent.amount.toString()),
      ...(memo ? { memo } : {}),
    },
  );
  return { transaction: serializedTransaction };
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
  const { serializedTransaction } = await craftTransactionLogic(
    { address: transactionIntent.sender },
    {
      recipient: transactionIntent.recipient,
      amount: new BigNumber(transactionIntent.amount.toString()),
      ...(memo ? { memo } : {}),
    },
  );

  const estimation = await estimateFeesLogic(serializedTransaction, currency);

  return { value: estimation.cost };
}
