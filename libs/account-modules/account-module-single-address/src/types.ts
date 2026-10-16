import type {
  AccountDescriptor,
  AccountTypes,
  JsonBalance,
  JsonStake,
} from "@ledgerhq/account-module-framework";
import type { BalanceOptions, CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";

/** What the account module calls on its coin module: a whole `CoinModuleApi` satisfies it. */
export type SingleAddressCoinModule = Pick<
  CoinModuleApi<any, any, any>,
  | "lastBlock"
  | "listOperations"
  | "getBalance"
  | "getStakes"
  | "getNextSequence"
  | "estimateFees"
  | "validateIntent"
  | "craftTransaction"
  | "combine"
  | "broadcast"
  | "craftTransactionData"
>;

export const SINGLE_ADDRESS_ACCOUNT_STATE_VERSION = 2;

/**
 * What one refresh brings up to date: the balances (`getBalances`), the stakes (`getStakes`, with
 * `includeStakes`), the operations (`listOperations`, `getPendingOperations`). A sync refreshes
 * them all.
 */
export type SingleAddressScope = "balances" | "stakes" | "operations";

/** Small, versioned and rebuildable from the network. */
export type SingleAddressAccountState = {
  /** Chain tip at the last completed refresh of the operations; 0 until one completes. */
  syncedHeight: number;
  balances: JsonBalance[];
  /** Empty unless the module is created with `includeStakes`. */
  stakes: JsonStake[];
  /** Epoch-ms time of the last refresh of each scope, by a sync or a read; 0: never. */
  refreshedAt: Record<SingleAddressScope, number>;
};

export interface SingleAddressAccountTypes extends AccountTypes {
  state: SingleAddressAccountState;
  options: never;
  utxo: never;
}

export type SingleAddressAccountModuleOptions = {
  /** Also reads `getStakes`, for coin modules that support it. */
  includeStakes?: boolean;
  /** Age after which an optimistic operation never seen on the network is dropped. */
  optimisticExpiryMs?: number;
  now?: () => number;
  /** Derivation path of the address; the account path by default. */
  addressPath?: (descriptor: AccountDescriptor) => string;
  /**
   * Handed to `getBalance` on every refresh of the balances (the CAL filter `includeAssets` of EVM
   * chains: one RPC call per spam contract otherwise).
   */
  balanceOptions?: BalanceOptions;
};
