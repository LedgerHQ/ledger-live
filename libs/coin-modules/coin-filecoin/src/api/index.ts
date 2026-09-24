import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import type {
  AddressValidationCurrencyParameters,
  Balance,
  BalanceOptions,
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
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { type FilecoinCoinConfig, type FilecoinContext } from "../config";
import { getBalance } from "../logic/account/getBalance";
import { getNextSequence } from "../logic/account/getNextSequence";
import { lastBlock } from "../logic/history/lastBlock";
import { listOperations } from "../logic/history/listOperations";
import { broadcast } from "../logic/transaction/broadcast";
import { combine } from "../logic/transaction/combine";
import { craftTransaction } from "../logic/transaction/craftTransaction";
import { estimateFees } from "../logic/transaction/estimateFees";
import { validateAddress } from "../logic/validateAddress";
import { validateIntent } from "../logic/validateIntent";

// Checked against CoinModuleImpl with `satisfies` rather than annotated as it: `satisfies` keeps the
// precise type of what is returned, so a caller sees exactly which methods exist. An annotation would
// widen every capability back to optional, including the ones this module does implement.
// Every method that reaches the network resolves the coin config from its context and passes it
// down explicitly (ADR-019); the api path never reads the getCoinConfig() singleton.
export function createApi() {
  return {
    broadcast: async (
      context: FilecoinContext,
      tx: string,
      options?: { broadcastConfig?: BroadcastConfig },
    ): Promise<string> => broadcast(await context.config(), tx, options?.broadcastConfig),

    combine: (
      _context: FilecoinContext,
      tx: string,
      signature: string[],
      options?: { pubkey?: string },
    ): string => combine(tx, signature, options?.pubkey),

    craftTransaction: async (
      context: FilecoinContext,
      intent: TransactionIntent,
      options?: { customFees?: FeeEstimation },
    ): Promise<CraftedTransaction> =>
      craftTransaction(await context.config(), intent, options?.customFees),

    estimateFees: async (
      context: FilecoinContext,
      intent: TransactionIntent,
      options?: { customFeesParameters?: FeeEstimation["parameters"] },
    ): Promise<FeeEstimation> =>
      estimateFees(await context.config(), intent, options?.customFeesParameters),

    lastBlock: async (context: FilecoinContext) => lastBlock(await context.config()),

    listOperations: async (
      context: FilecoinContext,
      address: string,
      options: ListOperationsOptions,
    ): Promise<Page<Operation>> => listOperations(await context.config(), address, options),

    validateIntent: (
      _context: FilecoinContext,
      intent: TransactionIntent,
      balances: Balance[],
      options?: { customFees?: FeeEstimation },
    ): Promise<TransactionValidation> => validateIntent(intent, balances, options?.customFees),

    getNextSequence: async (context: FilecoinContext, address: string): Promise<bigint> =>
      getNextSequence(await context.config(), address),

    validateAddress: (
      _context: FilecoinContext,
      address: string,
      parameters: Partial<AddressValidationCurrencyParameters>,
    ): Promise<boolean> => validateAddress(address, parameters),

    craftTransactionData: (_context: FilecoinContext, intent: TransactionIntent) =>
      craftTransactionData(intent),

    getBalance: (
      context: FilecoinContext,
      address: string,
      options?: BalanceOptions,
    ): Promise<Balance[]> =>
      rejectBalanceOptions(async () => getBalance(await context.config(), address), options),
  } satisfies CoinModuleImpl<FilecoinCoinConfig>;
}
