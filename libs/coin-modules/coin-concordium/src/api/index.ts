import type {
  CoinModuleApi,
  Balance,
  BalanceOptions,
  BlockInfo,
  Block,
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
  AddressValidationCurrencyParameters,
} from "@ledgerhq/coin-module-framework/api/index";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import {
  serializeTransfer,
  serializeTransferWithMemo,
  TransactionType,
} from "@ledgerhq/concordium-core";
import BigNumber from "bignumber.js";
import { validateAddress } from "../bridge/validateAddress";
import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  broadcast,
  combine,
  craftRawTransaction,
  craftTransaction as craftTransactionLogic,
  estimateFees as estimateFeesLogic,
  getBalance,
  getBlock,
  getBlockInfo,
  getNextValidSequence,
  lastBlock,
  listOperations as listOperationsLogic,
} from "../logic";
import type { ConcordiumCoinConfig, ConcordiumMemo } from "../types";
import { mapRawOperationToApiOperation } from "./utils";

type ConcordiumApiContext = Context<ConcordiumCoinConfig>;

/**
 * In the {@link Context}-based API (ADR-019) the coin configuration is resolved per call from
 * `context.config()` and threaded explicitly into the concordium network/logic layers. The
 * `currencyId` used for chain selection is captured once from {@link createApi} and forwarded from
 * this closure unchanged. The shared layers keep their singleton fallback (`getCoinConfig`) for the
 * classic bridge, which does not thread config.
 */
export function createApi(currencyId: string): CoinModuleApi<ConcordiumCoinConfig, ConcordiumMemo> {
  return {
    broadcast: async (context, tx) => {
      const config = await context.config();
      return broadcast(tx, currencyId, config);
    },
    async call() {
      throw new Error("call is not supported");
    },
    combine: (_context, tx, signature) => combine(tx, signature),
    craftTransaction: async (context, transactionIntent) => {
      const config = await context.config();
      return craftTransaction(transactionIntent, currencyId, config);
    },
    craftRawTransaction: async (_context, transaction, sender, publicKey, sequence) => {
      return craftRawTransaction(transaction, sender, publicKey, sequence);
    },
    estimateFees: async (context, transactionIntent) => {
      const config = await context.config();
      return estimateFees(transactionIntent, currencyId, config);
    },
    getBalance: async (context, address: string, options?: BalanceOptions): Promise<Balance[]> => {
      const config = await context.config();
      return rejectBalanceOptions(() => getBalance(address, currencyId, config), options);
    },
    lastBlock: async (context): Promise<BlockInfo> => {
      const config = await context.config();
      return lastBlock(currencyId, config);
    },
    listOperations: async (context, address, options): Promise<Page<Operation>> => {
      const config = await context.config();
      return listOperations(address, options, currencyId, config);
    },
    getBlock: async (context, height): Promise<Block> => {
      const config = await context.config();
      return getBlock(height, currencyId, config);
    },
    getBlockInfo: async (context, height): Promise<BlockInfo> => {
      const config = await context.config();
      return getBlockInfo(height, currencyId, config);
    },
    getStakes(
      _context: ConcordiumApiContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    getRewards(
      _context: ConcordiumApiContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    getValidators(
      _context: ConcordiumApiContext,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported");
    },
    validateIntent: async (
      _context: ConcordiumApiContext,
      _transactionIntent: TransactionIntent,
      _balances: Balance[],
      _options?: { customFees?: FeeEstimation },
    ): Promise<TransactionValidation> => {
      throw new Error("validateIntent is not supported");
    },
    getNextSequence: async (_context: ConcordiumApiContext, _address: string): Promise<bigint> => {
      throw new Error("getNextSequence is not supported");
    },
    validateAddress: async (
      _context: ConcordiumApiContext,
      address: string,
      parameters: Partial<AddressValidationCurrencyParameters>,
    ): Promise<boolean> => validateAddress(address, parameters),
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
  };
}

async function craftTransaction(
  transactionIntent: TransactionIntent<ConcordiumMemo>,
  currencyId: string,
  config?: ConcordiumCoinConfig,
): Promise<CraftedTransaction> {
  const nextSequenceNumber = await getNextValidSequence(
    transactionIntent.sender,
    currencyId,
    config,
  );
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
  config?: ConcordiumCoinConfig,
): Promise<FeeEstimation> {
  const memo =
    "memo" in transactionIntent && transactionIntent.memo?.type === "string"
      ? transactionIntent.memo.value
      : undefined;

  const estimation = await estimateFeesLogic(currencyId, memo, config);

  return { value: estimation.cost };
}

async function listOperations(
  address: string,
  options: ListOperationsOptions,
  currencyId: string,
  config?: ConcordiumCoinConfig,
): Promise<Page<Operation>> {
  const { items, next } = await listOperationsLogic(address, options, currencyId, config);

  return {
    items: items.map(mapRawOperationToApiOperation),
    next,
  };
}
