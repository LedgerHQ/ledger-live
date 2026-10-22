import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import type {
  AddressValidationCurrencyParameters,
  Balance,
  BalanceOptions,
  BlockInfo,
  CoinModuleImpl,
  CraftedTransaction,
  FeeEstimation,
  ListOperationsOptions,
  Operation,
  Page,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import type { TonConfig, TonContext } from "../config";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { getBalance } from "../logic/getBalance";
import { getBlockInfo } from "../logic/getBlockInfo";
import { getNextSequence } from "../logic/getNextSequence";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import { validateIntent } from "../logic/validateIntent";
import type { TonMemo } from "../types";
import { validateAddress } from "../validateAddress";

// Checked against CoinModuleImpl with `satisfies` rather than annotated as it, so the precise shape
// survives and a caller sees exactly which methods exist.
//
// Omitted rather than stubbed, and why:
//   - `getBlock`            — no consumer; a masterchain block's transactions span every shard.
//   - `getStakes`, `getRewards`, `getValidators`
//                           — the wallet has no native staking; TON staking goes through pool
//                             contracts reached from dApps.
//   - `craftRawTransaction` — the module accepts no externally-built transaction.
//   - `call`                — no read-only contract-call escape hatch is exposed.
//   - `register`            — no enrollment step.
//   - `getAccountInfo`      — nothing to report beyond balances and history.
//   - `listFeeOptions`      — TON fees are not settable.
// The consumer resolver applies `withDefaults`, which answers "not supported" for each of them,
// except `getAccountInfo` (no extra metadata) and `listFeeOptions` (left absent).
export function createApi() {
  return {
    // --- Blocks / chain state ---
    lastBlock: (context: TonContext): Promise<BlockInfo> => lastBlock(context),
    getBlockInfo: (context: TonContext, height: number): Promise<BlockInfo> =>
      getBlockInfo(context, height),

    // --- Account state ---
    getBalance: (
      context: TonContext,
      address: string,
      options?: BalanceOptions,
    ): Promise<Balance[]> => rejectBalanceOptions(() => getBalance(context, address), options),
    listOperations: (
      context: TonContext,
      address: string,
      options: ListOperationsOptions,
    ): Promise<Page<Operation>> => listOperations(context, address, options),
    getNextSequence: (context: TonContext, address: string): Promise<bigint> =>
      getNextSequence(context, address),
    validateAddress: (
      _context: TonContext,
      address: string,
      parameters: Partial<AddressValidationCurrencyParameters>,
    ): Promise<boolean> => validateAddress(address, parameters),

    // --- Transaction lifecycle ---
    craftTransaction: (context, intent, _options?): Promise<CraftedTransaction> =>
      craftTransaction(context, intent),
    estimateFees: (context, intent, _options?): Promise<FeeEstimation> =>
      estimateFees(context, intent),
    combine: (
      _context: TonContext,
      tx: string,
      signature: string[],
      options?: { pubkey?: string },
    ): string => combine(tx, signature, options?.pubkey),
    broadcast: (context: TonContext, tx: string): Promise<string> => broadcast(context, tx),
    validateIntent: (context, intent, balances, options?): Promise<TransactionValidation> =>
      validateIntent(context, intent, balances, options?.customFees),
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
  } satisfies CoinModuleImpl<TonConfig, TonMemo>;
}
