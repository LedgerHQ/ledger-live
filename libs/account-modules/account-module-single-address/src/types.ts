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

export const SINGLE_ADDRESS_ACCOUNT_STATE_VERSION = 1;

/** Small, versioned and rebuildable from the network. */
export type SingleAddressAccountState = {
  /** Chain tip at the last completed sync; 0 until one completes. */
  syncedHeight: number;
  balances: JsonBalance[];
  /** Empty unless the module is created with `includeStakes`. */
  stakes: JsonStake[];
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
   * Handed to `getBalance` on every sync (the CAL filter `includeAssets` of EVM chains: one RPC
   * call per spam contract otherwise).
   */
  balanceOptions?: BalanceOptions;
};
