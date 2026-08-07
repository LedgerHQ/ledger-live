import {
  CoinModuleApi,
  Balance,
  Block,
  BlockInfo,
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
import { validateAddress } from "../bridge/validateAddress";
import { combine } from "../common-logic/transaction/combine";
import { type CantonCoinConfig, type CantonContext } from "../config";

// The caller builds the {@link CantonContext} (config + logger) and passes it to each method (ADR-019).
// Canton is single-chain and its Alpaca methods don't read config, so createApi takes nothing.
export function createApi(): CoinModuleApi<CantonCoinConfig> {
  return {
    async call() {
      throw new Error("call is not supported");
    },
    broadcast: (_context: CantonContext, _tx: string): Promise<string> => {
      throw new Error("broadcast is not supported");
    },
    combine: (_context, tx, signature) => combine(tx, signature),
    craftTransaction(
      _context: CantonContext,
      _transactionIntent: TransactionIntent,
      _options?: { customFees?: FeeEstimation },
    ) {
      throw new Error("craftTransaction is not supported");
    },
    craftRawTransaction: (
      _context: CantonContext,
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees(
      _context: CantonContext,
      _transactionIntent: TransactionIntent,
    ): Promise<FeeEstimation> {
      throw new Error("estimateFees is not supported");
    },
    getBalance(_context: CantonContext, _address: string): Promise<Balance[]> {
      throw new Error("getBalance is not supported");
    },
    lastBlock(_context: CantonContext): Promise<BlockInfo> {
      throw new Error("listOperations is not supported");
    },
    listOperations(
      _context: CantonContext,
      _address: string,
      _options: ListOperationsOptions,
    ): Promise<Page<Operation>> {
      throw new Error("listOperations is not supported");
    },
    getBlock(_context: CantonContext, _height: number): Promise<Block> {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo(_context: CantonContext, _height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
    },
    getStakes(
      _context: CantonContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    getRewards(
      _context: CantonContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    getValidators(
      _context: CantonContext,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported");
    },
    validateIntent: async (
      _context: CantonContext,
      _transactionIntent: TransactionIntent,
      _balances: Balance[],
      _options?: { customFees?: FeeEstimation },
    ): Promise<TransactionValidation> => {
      throw new Error("validateIntent is not supported");
    },
    getNextSequence: async (_context: CantonContext, _address: string) => {
      throw new Error("getNextSequence is not supported");
    },
    validateAddress: (_context, address, parameters) => validateAddress(address, parameters),
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
  };
}
