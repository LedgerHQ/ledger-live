import type {
  Balance,
  BalanceOptions,
  Block,
  BlockInfo,
  CoinModuleApi,
  CraftedTransaction,
  Cursor,
  Page,
  Reward,
  Stake,
  TransactionIntent,
  Validator,
} from "@ledgerhq/coin-module-framework/api/index";
import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import { lastBlock } from "../logic/lastBlock";
import { getBalance as getAccountBalance } from "../logic/getBalance";
import { listOperations } from "../logic/listOperations";
import { estimateFees } from "../logic/estimateFees";
import { validateIntent } from "../logic/validateIntent";
import type { CasperConfig, CasperContext, CasperMemo } from "../types";

// The caller builds the {@link CasperContext} (config + logger) and passes it to each method (ADR-019).
export function createApi(): CoinModuleApi<CasperConfig, CasperMemo> {
  return {
    lastBlock,
    getBlockInfo(_context: CasperContext, _height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
    },
    getBlock(_context: CasperContext, _height: number): Promise<Block> {
      throw new Error("getBlock is not supported");
    },
    async call() {
      throw new Error("call is not supported");
    },
    async register() {
      throw new Error("register is not supported");
    },
    getValidators(
      _context: CasperContext,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported");
    },
    getBalance(
      context: CasperContext,
      address: string,
      options?: BalanceOptions,
    ): Promise<Balance[]> {
      return rejectBalanceOptions(() => getAccountBalance(context, address), options);
    },
    listOperations,
    getStakes(
      _context: CasperContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    getRewards(
      _context: CasperContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    craftTransaction: (_context, transactionIntent, options) =>
      craftTransaction(transactionIntent, options?.customFees),
    craftRawTransaction(
      _context: CasperContext,
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> {
      throw new Error("craftRawTransaction is not supported");
    },
    combine: (_context, tx, signature, options) => combine(tx, signature, options?.pubkey),
    broadcast: (context, tx) => broadcast(context, tx),
    estimateFees,
    validateIntent: async (_context, intent, balances, options) =>
      validateIntent(intent, balances, options?.customFees),
    getNextSequence(_context: CasperContext, _address: string): Promise<bigint> {
      throw new Error("getNextSequence is not supported");
    },
    validateAddress(
      _context: CasperContext,
      _address: string,
      _parameters: unknown,
    ): Promise<boolean> {
      throw new Error("validateAddress is not supported");
    },
    craftTransactionData(_context: CasperContext, _intent: TransactionIntent<CasperMemo>) {
      throw new Error("craftTransactionData is not supported");
    },
  };
}
