import type {
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
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/index";
import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { type KaspaCoinConfig, type KaspaContext } from "../config";
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
  validateIntent,
} from "../logic";

/**
 * Coin-module factory for native KAS. Kaspa is a UTXO / BlockDAG PoW chain: no per-account nonce,
 * no native staking, no in-module token standard (see `src/supportedFeatures.ts` —
 * `blockchain_txs: ["send"]`), so the account-model and staking/token capabilities are simply not
 * declared here.
 *
 * Checked against CoinModuleImpl with `satisfies` rather than annotated as it, so the precise shape
 * survives and a caller sees exactly which methods exist.
 *
 * Omitted rather than stubbed, with the reason each one does not apply:
 *  - `getNextSequence` — no per-account sequence/nonce; replay protection comes from spending
 *    one-time UTXOs. (The generic-coin-framework's createTransaction sets a synthetic zero nonce for
 *    kaspa, the same way it does for near/vechain/cardano, so signOperation never calls it.)
 *  - `craftRawTransaction` — the module does not accept an externally-built transaction.
 *  - `validateAddress` — on-device address validation is not exposed through this API.
 *  - `getStakes`, `getRewards`, `getValidators` — no native staking.
 *  - `call`, `register` — no read-only contract-call primitive and no indexer enrollment.
 *
 * The consumer resolver applies `withDefaults`, which answers "not supported" for each.
 */
export function createApi() {
  // Every method that reaches the network resolves the coin config from its context and passes it
  // down explicitly (ADR-019); the api path never reads the getCoinConfig() singleton.
  return {
    // --- Blocks / chain state ---
    lastBlock: async (context: KaspaContext): Promise<BlockInfo> =>
      lastBlock(await context.config()),
    getBlockInfo: async (context: KaspaContext, height: number): Promise<BlockInfo> =>
      getBlockInfo(await context.config(), height),
    getBlock: async (context: KaspaContext, height: number): Promise<Block> =>
      getBlock(await context.config(), height),

    // --- Account state ---
    getBalance: (
      context: KaspaContext,
      address: string,
      options?: BalanceOptions,
    ): Promise<Balance[]> =>
      rejectBalanceOptions(async () => getBalance(await context.config(), address), options),
    listOperations: async (
      context: KaspaContext,
      address: string,
      options: ListOperationsOptions,
    ): Promise<Page<Operation>> => listOperations(await context.config(), address, options),

    // --- Transaction lifecycle ---
    craftTransaction: async (
      context: KaspaContext,
      transactionIntent: TransactionIntent,
      options?: { customFees?: FeeEstimation },
    ): Promise<CraftedTransaction> =>
      craftTransaction(await context.config(), transactionIntent, options?.customFees),
    estimateFees: async (
      context: KaspaContext,
      transactionIntent: TransactionIntent,
      options?: { customFeesParameters?: FeeEstimation["parameters"] },
    ): Promise<FeeEstimation> =>
      estimateFees(await context.config(), transactionIntent, options?.customFeesParameters),
    combine: (
      _context: KaspaContext,
      tx: string,
      signature: string[],
      _options?: { pubkey?: string },
    ): string => combine(tx, signature),
    broadcast: async (
      context: KaspaContext,
      tx: string,
      options?: { broadcastConfig?: BroadcastConfig },
    ): Promise<string> => broadcast(await context.config(), tx, options?.broadcastConfig),
    validateIntent: (
      _context: KaspaContext,
      transactionIntent: TransactionIntent,
      balances: Balance[],
      options?: { customFees?: FeeEstimation },
    ): Promise<TransactionValidation> =>
      validateIntent(transactionIntent, balances, options?.customFees),
    craftTransactionData: (_context: KaspaContext, intent: TransactionIntent) =>
      craftTransactionData(intent),
  } satisfies CoinModuleImpl<KaspaCoinConfig>;
}
