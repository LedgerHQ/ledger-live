import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  CoinModuleApi,
  Block,
  BlockInfo,
  CraftedTransaction,
  Cursor,
  Page,
  Reward,
  Stake,
  Validator,
} from "@ledgerhq/coin-module-framework/api/index";
import type {
  Balance,
  BalanceOptions,
  BroadcastConfig,
  FeeEstimation,
  ListOperationsOptions,
  Operation,
  StakingTransactionIntent,
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/types";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import type { AptosCoinConfig, AptosContext } from "../config";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import { getBalances } from "../logic/getBalances";
import { validateAddress } from "../logic/validateAddress";
import { AptosAPI } from "../network";

/**
 * Resolves the coin configuration from the {@link AptosContext} and builds the {@link AptosAPI}
 * client from the context's `aptosSettings` rather than seeding the module-level singleton
 * (ADR-019).
 */
async function clientFromContext(context: AptosContext): Promise<AptosAPI> {
  const config = await context.config();
  return new AptosAPI(config.aptosSettings);
}

export function createApi(): CoinModuleApi<AptosCoinConfig> {
  return {
    async call(_context: AptosContext) {
      throw new Error("call is not supported");
    },
    broadcast: async (
      context: AptosContext,
      tx: string,
      _options?: { broadcastConfig?: BroadcastConfig },
    ): Promise<string> => (await clientFromContext(context)).broadcast(tx),
    combine: (
      _context: AptosContext,
      tx: string,
      signature: string[],
      options?: { pubkey?: string },
    ): string => combine(tx, signature, options?.pubkey),
    craftTransaction: async (
      context: AptosContext,
      transactionIntent: TransactionIntent | StakingTransactionIntent,
      _options?: { customFees?: FeeEstimation },
    ): Promise<CraftedTransaction> =>
      craftTransaction(await clientFromContext(context), transactionIntent as TransactionIntent),
    craftRawTransaction: (
      _context: AptosContext,
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: async (
      context: AptosContext,
      transactionIntent: TransactionIntent,
    ): Promise<FeeEstimation> => (await clientFromContext(context)).estimateFees(transactionIntent),
    getBalance: async (
      context: AptosContext,
      address: string,
      options?: BalanceOptions,
    ): Promise<Balance[]> =>
      rejectBalanceOptions(
        async () => getBalances(await clientFromContext(context), address),
        options,
      ),
    lastBlock: async (context: AptosContext) => (await clientFromContext(context)).getLastBlock(),
    listOperations: async (
      context: AptosContext,
      address: string,
      options: ListOperationsOptions,
    ): Promise<Page<Operation>> =>
      (await clientFromContext(context)).listOperations(address, options.minHeight),
    getBlock(_context: AptosContext, _height: number): Promise<Block> {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo(_context: AptosContext, _height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
    },
    getStakes(
      _context: AptosContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    getRewards(
      _context: AptosContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    getValidators(
      _context: AptosContext,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported");
    },
    validateIntent: async (
      _context: AptosContext,
      _transactionIntent: TransactionIntent | StakingTransactionIntent,
      _balances: Balance[],
      _options?: { customFees?: FeeEstimation },
    ): Promise<TransactionValidation> => {
      throw new Error("validateIntent is not supported");
    },
    getNextSequence: async (_context: AptosContext, _address: string): Promise<bigint> => {
      throw new Error("getNextSequence is not supported");
    },
    validateAddress: (
      _context: AptosContext,
      address: string,
      parameters: Parameters<typeof validateAddress>[1],
    ): Promise<boolean> => validateAddress(address, parameters),
    craftTransactionData: (
      _context: AptosContext,
      intent: TransactionIntent,
    ): ReturnType<typeof craftTransactionData> => craftTransactionData(intent),
  };
}
