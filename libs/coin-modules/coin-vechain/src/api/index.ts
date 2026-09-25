import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";
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

// The balance options this module can actually apply. `height` maps onto Thor's `revision`, so a
// historical read is a real capability here; anything else is refused rather than dropped, because
// silently ignoring an option answers a different question than the caller asked. Listing the
// supported keys (instead of testing for the unsupported ones) keeps a future framework option
// rejected by default until VeChain opts into it.
const SUPPORTED_BALANCE_OPTIONS: readonly (keyof BalanceOptions)[] = ["height"];

function resolveBalanceHeight(options?: BalanceOptions): number | undefined {
  const unsupported = Object.entries(options ?? {})
    .filter(
      ([key, value]) =>
        value !== undefined && !SUPPORTED_BALANCE_OPTIONS.includes(key as keyof BalanceOptions),
    )
    .map(([key]) => key);

  if (unsupported.length > 0) {
    throw new InvalidParameterError(
      `vechain: getBalance does not support the balance option(s): ${unsupported.join(", ")}`,
    );
  }

  return options?.height;
}

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
    // `async` so a rejected option surfaces as a rejected promise, not a synchronous throw.
    getBalance: async (
      context: VechainContext,
      address: string,
      options?: BalanceOptions,
    ): Promise<Balance[]> => getBalance(context, address, resolveBalanceHeight(options)),
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
