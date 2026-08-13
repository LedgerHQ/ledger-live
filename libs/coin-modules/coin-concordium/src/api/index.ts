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
 * `context.config()` and threaded explicitly (as the required first argument) into the concordium
 * network/logic layers. The `currencyId` used for chain selection is captured once from
 * {@link createApi} and forwarded from this closure unchanged. The classic bridge resolves the same
 * config from its `getCoinConfig` singleton and threads it the same way.
 */
export function createApi(currencyId: string): CoinModuleApi<ConcordiumCoinConfig, ConcordiumMemo> {
  return {
    broadcast: async (context, tx) => {
      const config = await context.config();
      return broadcast(config, tx, currencyId);
    },
    async call() {
      throw new Error("call is not supported");
    },
    async register() {
      throw new Error("register is not supported");
    },
    combine: (_context, tx, signature) => combine(tx, signature),
    craftTransaction: async (context, transactionIntent) => {
      const config = await context.config();
      return craftTransaction(config, transactionIntent, currencyId);
    },
    craftRawTransaction: async (_context, transaction, sender, publicKey, sequence) => {
      return craftRawTransaction(transaction, sender, publicKey, sequence);
    },
    estimateFees: async (context, transactionIntent) => {
      const config = await context.config();
      return estimateFees(config, transactionIntent, currencyId);
    },
    getBalance: async (context, address: string, options?: BalanceOptions): Promise<Balance[]> => {
      const config = await context.config();
      return rejectBalanceOptions(() => getBalance(config, address, currencyId), options);
    },
    lastBlock: async (context): Promise<BlockInfo> => {
      const config = await context.config();
      return lastBlock(config, currencyId);
    },
    listOperations: async (context, address, options): Promise<Page<Operation>> => {
      const config = await context.config();
      return listOperations(config, address, options, currencyId);
    },
    getBlock: async (context, height): Promise<Block> => {
      const config = await context.config();
      return getBlock(config, height, currencyId);
    },
    getBlockInfo: async (context, height): Promise<BlockInfo> => {
      const config = await context.config();
      return getBlockInfo(config, height, currencyId);
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
  config: ConcordiumCoinConfig,
  transactionIntent: TransactionIntent<ConcordiumMemo>,
  currencyId: string,
): Promise<CraftedTransaction> {
  const nextSequenceNumber = await getNextValidSequence(
    config,
    transactionIntent.sender,
    currencyId,
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
  config: ConcordiumCoinConfig,
  transactionIntent: TransactionIntent<ConcordiumMemo>,
  currencyId: string,
): Promise<FeeEstimation> {
  const memo =
    "memo" in transactionIntent && transactionIntent.memo?.type === "string"
      ? transactionIntent.memo.value
      : undefined;

  const estimation = await estimateFeesLogic(config, currencyId, memo);

  return { value: estimation.cost };
}

async function listOperations(
  config: ConcordiumCoinConfig,
  address: string,
  options: ListOperationsOptions,
  currencyId: string,
): Promise<Page<Operation>> {
  const { items, next } = await listOperationsLogic(config, address, options, currencyId);

  return {
    items: items.map(mapRawOperationToApiOperation),
    next,
  };
}
