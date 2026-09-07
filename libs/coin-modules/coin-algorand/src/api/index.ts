import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  Balance,
  CoinModuleImpl,
  FeeEstimation,
  TransactionIntent,
  BalanceOptions,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import type { AlgorandCoinConfig, AlgorandContext } from "../config";
import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-module-framework/api/types";
import {
  broadcast,
  combine,
  craftApiTransaction,
  estimateFees,
  getBalance,
  getBlockInfo,
  lastBlock,
  listOperations,
  validateIntent,
} from "../logic";
import type { AlgorandMemo } from "../types";
import { validateAddress } from "../validateAddress";

// Checked against CoinModuleImpl with `satisfies` rather than annotated as it, so the precise shape
// survives and a caller sees exactly which methods exist.
//
// Omitted rather than stubbed: `call`, `register`, `craftRawTransaction`, `getBlock`, `getStakes`,
// `getRewards`, `getValidators` — none are supported for Algorand — and `getNextSequence`, which the
// module recorded as not applicable to Algorand. The consumer resolver applies `withDefaults`, which
// answers "not supported" for each.
//
// `getBlockInfo`, `validateIntent` and `validateAddress` stay: they are real implementations, and
// listing them here is what tells a caller they are more than a placeholder.
export function createApi() {
  return {
    broadcast: (context: AlgorandContext, signedTx: string, _options?) =>
      broadcast(context, signedTx),
    combine: (_context: AlgorandContext, unsignedTx: string, signature: string[], _options?) =>
      combine(unsignedTx, signature),
    craftTransaction: (
      context: AlgorandContext,
      transactionIntent: TransactionIntent<AlgorandMemo>,
      _options?,
    ) => craftApiTransaction(context, transactionIntent),
    estimateFees: (
      context: AlgorandContext,
      _transactionIntent: TransactionIntent<AlgorandMemo>,
      _options?,
    ) => estimateFees(context),
    getBalance: (context: AlgorandContext, address: string, options?: BalanceOptions) =>
      rejectBalanceOptions(() => getBalance(context, address), options),
    getBlockInfo: (context: AlgorandContext, height: number) => getBlockInfo(context, height),
    lastBlock: (context: AlgorandContext) => lastBlock(context),
    listOperations: (context: AlgorandContext, address: string, options) =>
      listOperations(context, address, options),
    validateIntent: (
      context: AlgorandContext,
      intent: TransactionIntent<AlgorandMemo>,
      balances: Balance[],
      options?: { customFees?: FeeEstimation },
    ) => validateIntent(context, intent, balances, options?.customFees),
    validateAddress: (
      _context: AlgorandContext,
      address: string,
      parameters: Partial<AddressValidationCurrencyParameters>,
    ) => validateAddress(address, parameters),
    craftTransactionData: (_context: AlgorandContext, intent: TransactionIntent) =>
      craftTransactionData(intent),
  } satisfies CoinModuleImpl<AlgorandCoinConfig, AlgorandMemo>;
}
