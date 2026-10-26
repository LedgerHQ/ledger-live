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
import type { IcpIntent, IcpTxData } from "../logic/intent";
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
//   - `getStakes`, `getRewards` — an address does not identify its neurons. No unsigned governance
//                             call lists a principal's neurons; only a `list_neurons` request the
//                             device signs does, and that stays with the wiring.
//   - `getValidators`       — the NNS has no validators.
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
// Two kinds of intent are crafted:
//   - a native send: `intentType: "transaction"`, `type: "send"`;
//   - a neuron command: `intentType: "staking"`, `type` the command, the neuron id in `valAddress`,
//     the parameters in `data`.
// The default intent mapping reads `mode`, which ICP transactions lack, so it produces neither. The
// wiring supplies them through the family mapping.
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
    estimateFees: (_context: IcpContext, intent: IcpIntent): Promise<FeeEstimation> =>
      settle(() => estimateFees(intent)),
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
  } satisfies CoinModuleImpl<IcpCurrencyConfig, IcpMemo, IcpTxData>;
}

export default createApi;
