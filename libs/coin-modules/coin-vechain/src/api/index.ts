import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import type {
  AddressValidationCurrencyParameters,
  Balance,
  BalanceOptions,
  Block,
  BlockInfo,
  BroadcastConfig,
  CoinModuleImpl,
  CraftedTransaction,
  FeeEstimation,
  ListOperationsOptions,
  Operation,
  Page,
  StakingTransactionIntent,
  TransactionIntent,
  TransactionValidation,
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
//
// Checked against CoinModuleImpl with `satisfies` rather than annotated as it, so the precise shape
// survives and a caller sees exactly which methods exist.
//
// Omitted rather than stubbed:
//   - `call`, `register` — the module implements neither.
//   - `craftRawTransaction` — the chain takes no externally-built transaction.
//   - `getStakes`, `getRewards`, `getValidators` — VeChain staking is not supported here.
//   - `getNextSequence` — not applicable to VeChain's account model (replay protection uses the
//     transaction's blockRef/nonce, not a per-account sequence).
// The consumer resolver applies `withDefaults`, which answers "not supported" for each of them.
export function createApi() {
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
      signature: string[],
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
  } satisfies CoinModuleImpl<VechainCurrencyConfig>;
}
