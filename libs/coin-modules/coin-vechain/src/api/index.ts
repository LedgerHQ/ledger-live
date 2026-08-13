import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import type {
  AddressValidationCurrencyParameters,
  Balance,
  BalanceOptions,
  Block,
  BlockInfo,
  BroadcastConfig,
  CoinModuleApi,
  CraftedTransaction,
  Cursor,
  FeeEstimation,
  ListOperationsOptions,
  Operation,
  Page,
  Reward,
  Stake,
  StakingTransactionIntent,
  TransactionIntent,
  TransactionValidation,
  Validator,
} from "@ledgerhq/coin-module-framework/api/index";
import { type VechainContext, type VechainCurrencyConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  getBlock,
  getBlockInfo,
  lastBlock,
  listOperations,
  validateAddress,
  validateIntent,
} from "../logic";

// CoinModuleApi (Alpaca) factory for VET + VTHO. Each method resolves its config from
// `context.config()` and threads it explicitly to the logic/network layers — the module never
// seeds or reads the coin-config singleton on this path (the classic bridge still does).
export function createApi(): CoinModuleApi<VechainCurrencyConfig> {
  return {
    lastBlock: (context: VechainContext): Promise<BlockInfo> => lastBlock(context),
    getBlockInfo: (context: VechainContext, height: number): Promise<BlockInfo> =>
      getBlockInfo(context, height),
    getBlock: (context: VechainContext, height: number): Promise<Block> =>
      getBlock(context, height),
    getBalance: (
      context: VechainContext,
      address: string,
      options?: BalanceOptions,
    ): Promise<Balance[]> => rejectBalanceOptions(() => getBalance(context, address), options),
    listOperations: (
      context: VechainContext,
      address: string,
      options: ListOperationsOptions,
    ): Promise<Page<Operation>> => listOperations(context, address, options),
    craftTransaction: (
      context: VechainContext,
      transactionIntent: TransactionIntent | StakingTransactionIntent,
      options?: { customFees?: FeeEstimation },
    ): Promise<CraftedTransaction> =>
      craftTransaction(context, transactionIntent as TransactionIntent, options?.customFees),
    estimateFees: (
      context: VechainContext,
      transactionIntent: TransactionIntent,
      options?: { customFeesParameters?: FeeEstimation["parameters"] },
    ): Promise<FeeEstimation> =>
      estimateFees(context, transactionIntent, options?.customFeesParameters),
    combine: (
      _context: VechainContext,
      tx: string,
      signature: string,
      _options?: { pubkey?: string },
    ): string => combine(tx, signature),
    broadcast: (
      context: VechainContext,
      signedTx: string,
      options?: { broadcastConfig?: BroadcastConfig },
    ): Promise<string> => broadcast(context, signedTx, options?.broadcastConfig),
    validateIntent: (
      _context: VechainContext,
      transactionIntent: TransactionIntent | StakingTransactionIntent,
      balances: Balance[],
      options?: { customFees?: FeeEstimation },
    ): Promise<TransactionValidation> =>
      validateIntent(transactionIntent as TransactionIntent, balances, options?.customFees),
    craftTransactionData: (_context: VechainContext, intent: TransactionIntent) =>
      craftTransactionData(intent),
    validateAddress: (
      _context: VechainContext,
      address: string,
      parameters: Partial<AddressValidationCurrencyParameters>,
    ): Promise<boolean> => validateAddress(address, parameters),
    // --- Not applicable / not supported for VeChain ---
    getNextSequence: (_context: VechainContext, _address: string): Promise<bigint> => {
      throw new Error("getNextSequence is not applicable for Vechain");
    },
    craftRawTransaction: (
      _context: VechainContext,
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    call: (_context: VechainContext) => {
      throw new Error("call is not supported");
    },
    getStakes: (
      _context: VechainContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Stake>> => {
      throw new Error("getStakes is not supported");
    },
    getRewards: (
      _context: VechainContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Reward>> => {
      throw new Error("getRewards is not supported");
    },
    getValidators: (
      _context: VechainContext,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Validator>> => {
      throw new Error("getValidators is not supported");
    },
  };
}
