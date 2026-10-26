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
import type { IcpContext, IcpCurrencyConfig } from "../config";
import { AccountIdentifier } from "../logic/accountIdentifier";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { getBalance } from "../logic/getBalance";
import { getBlockInfo } from "../logic/getBlockInfo";
import type { IcpIntent } from "../logic/intent";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import { validateIntent } from "../logic/validateIntent";
import type { IcpMemo } from "../types";

// Kept for consumers that import the network client from this entry point.
export * from "../network/api";

// Runs a synchronous step as the Promise the contract expects, so a throw becomes a rejection.
const settle = <T>(step: () => T): Promise<T> => Promise.resolve().then(step);

// CoinModuleApi (Alpaca) factory for native ICP, alongside the account bridge. Endpoints and canister
// ids are still constants, so the context is accepted and ignored.
//
// Checked against CoinModuleImpl with `satisfies` rather than annotated as it, so the precise shape
// survives and a caller sees exactly which methods exist.
//
// Omitted rather than stubbed, and why:
//   - `getStakes`, `getRewards`, `getValidators` — staking (neurons) is deferred, not impossible:
//                             neurons are not discoverable from an account identifier, and neuron
//                             commands need a call and a read-state signature plus claim_or_refresh.
//   - `getBlock`            — reading a block together with all its transactions is not supported.
//   - `getNextSequence`     — the ledger has no account nonce; `created_at_time` deduplicates.
//                             The generic `signOperation` calls it when the intent has no
//                             `sequence`, so a generic send needs the transaction to carry a `nonce`.
//   - `craftRawTransaction` — the module accepts no externally-built transaction.
//   - `call`                — no read-only canister-call escape hatch is exposed.
//   - `register`            — no enrollment step.
// The consumer resolver applies `withDefaults`, which answers "not supported" for each of them.
// `getAccountInfo` is omitted too: `withDefaults` answers `{ type: "none" }`, as ICP accounts carry
// no extra metadata.
//
// Only `type: "send"` intents are crafted. The default intent mapping reads `mode`, which ICP
// transactions lack, so the wiring maps ICP's `type` through `computeIntentType`.
export function createApi() {
  return {
    lastBlock: (_context: IcpContext): Promise<BlockInfo> => lastBlock(),
    getBlockInfo: (_context: IcpContext, height: number): Promise<BlockInfo> =>
      getBlockInfo(height),
    getBalance: (
      _context: IcpContext,
      address: string,
      options?: BalanceOptions,
    ): Promise<Balance[]> => rejectBalanceOptions(() => getBalance(address), options),
    listOperations: (
      _context: IcpContext,
      address: string,
      options: ListOperationsOptions,
    ): Promise<Page<Operation>> => listOperations(address, options),
    craftTransaction: (
      _context: IcpContext,
      intent: IcpIntent,
      options?: { customFees?: FeeEstimation },
    ): Promise<CraftedTransaction> => settle(() => craftTransaction(intent, options?.customFees)),
    estimateFees: (_context: IcpContext, _intent: IcpIntent): Promise<FeeEstimation> =>
      settle(estimateFees),
    combine: (
      _context: IcpContext,
      tx: string,
      signature: string[],
      options?: { pubkey?: string },
    ): string => combine(tx, signature, options?.pubkey),
    broadcast: (_context: IcpContext, tx: string): Promise<string> => broadcast(tx),
    validateIntent: (
      _context: IcpContext,
      intent: IcpIntent,
      balances: Balance[],
      options?: { customFees?: FeeEstimation },
    ): Promise<TransactionValidation> =>
      settle(() => validateIntent(intent, balances, options?.customFees)),
    validateAddress: (
      _context: IcpContext,
      address: string,
      _parameters: Partial<AddressValidationCurrencyParameters>,
    ): Promise<boolean> => settle(() => AccountIdentifier.isValid(address)),
    craftTransactionData: (_context: IcpContext, intent: IcpIntent) => craftTransactionData(intent),
  } satisfies CoinModuleImpl<IcpCurrencyConfig, IcpMemo>;
}

export default createApi;
