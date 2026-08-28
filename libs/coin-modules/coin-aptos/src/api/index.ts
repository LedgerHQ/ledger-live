import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  CoinModuleImpl,
  CraftedTransaction,
  Page,
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

// Checked against CoinModuleImpl with `satisfies` rather than annotated as it, so the precise shape
// survives and a caller sees exactly which methods exist.
//
// Omitted rather than stubbed: `call`, `register`, `craftRawTransaction`, `getBlock`, `getBlockInfo`,
// `getStakes`, `getRewards`, `getValidators`, `validateIntent` and `getNextSequence`. Aptos has no
// on-chain staking surface exposed through this module, no read-only contract-call primitive, and no
// enrollment backend; block queries and intent validation are not wired to the Aptos node yet. The
// consumer resolver applies `withDefaults`, which answers "not supported" for each.
//
// `validateAddress` stays: it is a real, offline check on the address shape.
export function createApi() {
  return {
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
    estimateFees: async (
      context: AptosContext,
      transactionIntent: TransactionIntent,
      _options?,
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
    validateAddress: (
      _context: AptosContext,
      address: string,
      parameters: Parameters<typeof validateAddress>[1],
    ): Promise<boolean> => validateAddress(address, parameters),
    craftTransactionData: (
      _context: AptosContext,
      intent: TransactionIntent,
    ): ReturnType<typeof craftTransactionData> => craftTransactionData(intent),
  } satisfies CoinModuleImpl<AptosCoinConfig>;
}
