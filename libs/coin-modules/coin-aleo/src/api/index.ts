import type {
  CoinModuleApi,
  Balance,
  Block,
  BlockInfo,
  CraftedTransaction,
  Cursor,
  FeeEstimation,
  MemoNotSupported,
  Page,
  Reward,
  Stake,
  TransactionIntent,
  TransactionValidation,
  Validator,
  BalanceOptions,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import { estimateFees, getBalance, lastBlock, listOperations, validateAddress } from "../logic";
import { getTransactionType } from "../logic/utils";
import type { AleoContext, AleoCoinConfig, AleoTransactionIntentData } from "../types";

// currencyId is captured here (it can't live on the Context). The logic functions are shared with
// the classic bridge (config-based), so each method resolves config via context.config() and passes
// it down — no context-first wrappers.
export function createApi(
  currencyId: string,
): CoinModuleApi<AleoCoinConfig, MemoNotSupported, AleoTransactionIntentData> {
  return {
    async call() {
      throw new Error("call is not supported");
    },
    broadcast: (_context: AleoContext, _signature: string): Promise<string> => {
      throw new Error("broadcast is not supported");
    },
    combine: (
      _context: AleoContext,
      _transaction: string,
      _signature: string[],
      _options?: { pubkey?: string },
    ): string => {
      throw new Error("combine is not supported");
    },
    craftTransaction: (
      _context: AleoContext,
      _txIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData>,
      _options?: { customFees?: FeeEstimation },
    ): Promise<CraftedTransaction> => {
      throw new Error("craftTransaction is not supported");
    },
    craftRawTransaction: (
      _context: AleoContext,
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: async (context: AleoContext, intent): Promise<FeeEstimation> => {
      const config = await context.config();
      return estimateFees({
        configOrCurrencyId: config,
        transactionType: getTransactionType(intent),
      });
    },
    getBalance: async (
      context: AleoContext,
      address: string,
      options?: BalanceOptions,
    ): Promise<Balance[]> => {
      const config = await context.config();
      return rejectBalanceOptions(() => getBalance(config, address), options);
    },
    lastBlock: async (context: AleoContext): Promise<BlockInfo> => {
      const config = await context.config();
      return lastBlock(config);
    },
    listOperations: async (context: AleoContext, address, options) => {
      const config = await context.config();
      const { operations, nextCursor } = await listOperations({
        config,
        currencyId,
        address,
        options,
        mode: "coin-framework",
      });
      return { items: operations, next: nextCursor ?? undefined };
    },
    getBlock(_context, _height): Promise<Block> {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo(_context, _height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
    },
    getStakes(_context, _address: string, _options?: { cursor?: Cursor }): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    getRewards(_context, _address: string, _options?: { cursor?: Cursor }): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    getValidators(_context, _options?: { cursor?: Cursor }): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported");
    },
    validateIntent: (
      _context: AleoContext,
      _transactionIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData>,
      _balances: Balance[],
      _options?: { customFees?: FeeEstimation },
    ): Promise<TransactionValidation> => {
      throw new Error("validateIntent is not supported");
    },
    getNextSequence: (_context: AleoContext, _address: string) => {
      throw new Error("getNextSequence is not supported");
    },
    validateAddress: (_context: AleoContext, address, parameters) =>
      validateAddress(address, parameters),
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
  };
}
