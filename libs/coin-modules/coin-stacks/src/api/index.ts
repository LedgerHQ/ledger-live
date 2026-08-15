import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import type {
  AddressValidationCurrencyParameters,
  Balance,
  BalanceOptions,
  Block,
  BlockInfo,
  CoinModuleApi,
  CraftedTransaction,
  Cursor,
  FeeEstimation,
  ListOperationsOptions,
  MemoNotSupported,
  Operation,
  Page,
  Reward,
  Stake,
  TransactionIntent,
  TransactionValidation,
  Validator,
} from "@ledgerhq/coin-module-framework/api/index";
import type { StacksContext, StacksCurrencyConfig } from "../config";
import type { StacksTxData } from "../types";
import {
  broadcast,
  combine,
  craftTransaction,
  craftTransactionData,
  estimateFees,
  getBalance,
  getBlock,
  getBlockInfo,
  getNextSequence,
  getStakes,
  lastBlock,
  listOperations,
  validateAddress,
  validateIntent,
} from "../logic";

// CoinModuleApi (Alpaca) factory for STX + SIP-010 tokens, alongside the existing account bridge
// (bridge path untouched). Every method resolves its config from `context.config()` (ADR-019),
// but coin-stacks's own logic doesn't need config for anything today, so context is accepted and
// ignored throughout rather than threaded further down.
export function createApi(): CoinModuleApi<StacksCurrencyConfig, MemoNotSupported, StacksTxData> {
  return {
    lastBlock: (_context: StacksContext): Promise<BlockInfo> => lastBlock(),
    getBlockInfo: (_context: StacksContext, height: number): Promise<BlockInfo> =>
      getBlockInfo(height),
    getBlock: (_context: StacksContext, height: number): Promise<Block> => getBlock(height),
    getBalance: (
      _context: StacksContext,
      address: string,
      options?: BalanceOptions,
    ): Promise<Balance[]> => rejectBalanceOptions(() => getBalance(address), options),
    listOperations: (
      _context: StacksContext,
      address: string,
      options: ListOperationsOptions,
    ): Promise<Page<Operation>> => listOperations(address, options),
    craftTransaction: (
      _context: StacksContext,
      transactionIntent: TransactionIntent<MemoNotSupported, StacksTxData>,
      options?: { customFees?: FeeEstimation },
    ): Promise<CraftedTransaction> => craftTransaction(transactionIntent, options?.customFees),
    estimateFees: (
      _context: StacksContext,
      transactionIntent: TransactionIntent<MemoNotSupported, StacksTxData>,
      options?: { customFeesParameters?: FeeEstimation["parameters"] },
    ): Promise<FeeEstimation> => estimateFees(transactionIntent, options?.customFeesParameters),
    // Stacks is single-signature: the framework requires throwing if more/fewer than one
    // signature is supplied (nested/multi-call intents aren't produced by craftTransaction here).
    combine: (_context: StacksContext, tx: string, signature: string[]): string => {
      if (signature.length !== 1) {
        throw new Error("stacks: combine expects exactly one signature");
      }
      return combine(tx, signature[0]);
    },
    broadcast: (_context: StacksContext, tx: string): Promise<string> => broadcast(tx),
    validateIntent: (
      _context: StacksContext,
      transactionIntent: TransactionIntent<MemoNotSupported, StacksTxData>,
      balances: Balance[],
      options?: { customFees?: FeeEstimation },
    ): Promise<TransactionValidation> =>
      validateIntent(transactionIntent, balances, options?.customFees),
    getNextSequence: (_context: StacksContext, address: string): Promise<bigint> =>
      getNextSequence(address),
    validateAddress: (
      _context: StacksContext,
      address: string,
      parameters: Partial<AddressValidationCurrencyParameters>,
    ): Promise<boolean> => validateAddress(address, parameters),
    craftTransactionData: (
      _context: StacksContext,
      intent: TransactionIntent<MemoNotSupported, StacksTxData>,
    ): StacksTxData => craftTransactionData(intent),
    getStakes: (_context: StacksContext, address: string): Promise<Page<Stake>> =>
      getStakes(address),
    // --- Not applicable / not supported for Stacks ---
    async call(_context: StacksContext) {
      throw new Error("call is not supported");
    },
    async register() {
      throw new Error("register is not supported");
    },
    craftRawTransaction: (
      _context: StacksContext,
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    getRewards: (
      _context: StacksContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Reward>> => {
      throw new Error("getRewards is not supported");
    },
    getValidators: (
      _context: StacksContext,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Validator>> => {
      throw new Error("getValidators is not supported");
    },
  };
}
