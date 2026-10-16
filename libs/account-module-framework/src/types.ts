import type {
  AssetInfo,
  Balance,
  BroadcastConfig,
  CraftedTransaction,
  Cursor,
  EstimateFeesOptions,
  FeeEstimation,
  Memo,
  Page,
  Stake,
  TransactionIntent,
  TransactionValidation,
  TxData,
} from "@ledgerhq/coin-module-framework/api/types";
import type { Context } from "@ledgerhq/coin-module-framework/config";

/** A value that survives JSON serialization unchanged: no bigint, no Date, no class instance. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

/** A persisted value with its format version, so that an implementation can migrate old ones. */
export type Versioned<T extends JsonValue = JsonValue> = { version: number; data: T };

/** What identifies an account. Immutable: the account id is derived from it. */
export type AccountDescriptor = {
  currencyId: string;
  /** Derivation mode of the account ("" for BIP44, "segwit", "native_segwit", "taproot", ...). */
  derivationMode: string;
  /** Account index in the derivation scheme. */
  index: number;
  /** The account key: an extended public key, or the address of a single-address account. */
  key: string;
  /** Account level derivation path, e.g. "84'/0'/0'". */
  derivationPath: string;
};

/**
 * The impact of one transaction on the whole account, for one asset.
 *
 * Unlike a `CoinModuleApi` operation, which is the impact on one address, it is computed against
 * every address of the account: change and self-sends are told apart.
 */
export type AccountOperation = {
  /** Unique within the account. */
  id: string;
  hash: string;
  /** Same vocabulary as `Operation.type` ("IN", "OUT", "FEES", ...). */
  type: string;
  /** Absolute change of the account balance in `asset`, the fee included when paid in it. */
  value: bigint;
  fee: bigint;
  asset: AssetInfo;
  senders: string[];
  recipients: string[];
  /** Who paid the fee, when the chain says. */
  feesPayer?: string;
  /** The coin module's `Operation.memo` (structured). */
  memo?: unknown;
  /** `null` while the transaction is not in a block. */
  block: { height: number; hash: string; time: Date } | null;
  date: Date;
  failed: boolean;
  /** Recorded by `broadcast`, not seen on the network yet. */
  optimistic?: boolean;
  /** Module specific data (the spent outpoints of a UTXO transaction, a nonce, ...). */
  details?: Record<string, unknown>;
};

/** Local history storage, provided by the client. One per account. */
export interface HistoryStore {
  /** Inserts or replaces operations by id. */
  upsert(operations: AccountOperation[]): Promise<void>;
  remove(operationIds: string[]): Promise<void>;
  /** Newest first. */
  list(options?: { cursor?: Cursor; limit?: number }): Promise<Page<AccountOperation>>;
}

/**
 * The account state as the client persists it, provided by the client. One per account: the module
 * reads it, and writes it back when it refreshes the account.
 */
export interface StateStore<State extends JsonValue = JsonValue> {
  /** `undefined` for an account never synced. */
  get(): Promise<Versioned<State> | undefined>;
  put(state: Versioned<State>): Promise<void>;
}

/** What a function knows about one account: what identifies it, and the stores of the client. */
export type AccountData<State extends JsonValue = JsonValue> = {
  descriptor: AccountDescriptor;
  state: StateStore<State>;
  history: HistoryStore;
};

/** Options of a read. */
export type ReadOptions = {
  /**
   * Refreshes the scope the value comes from first: network calls, and the refreshed scope written
   * to `account.state` / `account.history`. Without it, a read makes no network call.
   */
  refresh?: boolean;
};

/**
 * A value read from the account. No `updatedAt`: the value is fresh, the read refreshed its scope
 * (or it needs no network at all). Otherwise `updatedAt` is the epoch-ms time of the last refresh
 * of its scope, by a sync or a read; 0 when the scope was never refreshed.
 */
export type AccountRead<T> = { value: T; updatedAt?: number };

/** An address of the account. */
export type AccountAddress = {
  address: string;
  derivationPath: string;
  /** Holds history. */
  used: boolean;
};

export type SyncProgress = {
  /** Chain tip the account is synced to. */
  blockHeight?: number;
  /** Module specific counters (addresses scanned, operations fetched, ...). */
  counters?: Record<string, number>;
};

/**
 * One step of a sync. The state is not carried: the sync puts each new one into `account.state`,
 * the one source of it, so that an interrupted sync resumes from there.
 */
export type SyncEvent = { progress: SyncProgress };

/**
 * A `TransactionIntent` whose sender is the account. `sender` and `senderPublicKey` are optional:
 * the module sets them from the account when absent.
 */
export type AccountIntent<Options = unknown> = Omit<
  TransactionIntent,
  "sender" | "senderPublicKey"
> & {
  sender?: string;
  senderPublicKey?: string;
  memo?: Memo;
  data?: TxData;
  /** Module specific options (coin control, the pending transaction to replace, ...). */
  accountOptions?: Options;
} & Record<string, unknown>;

/** The intent as the coin module receives it, completed by the account module. */
export type CoinIntent = TransactionIntent<any, any>;

export type AccountFeeOptions = {
  customFeesParameters?: FeeEstimation["parameters"];
  feeOption?: EstimateFeesOptions;
};

/** A crafted transaction, and the operation it becomes once broadcast. */
export type CraftedAccountTransaction = CraftedTransaction & {
  /** Optimistic operation; its hash is unknown until the broadcast (empty). */
  operation: AccountOperation;
};

/** The module specific types of an implementation, in one bundle. */
export interface AccountTypes {
  /** Persisted state. */
  state: JsonValue;
  /** Options of the write path (`AccountIntent.accountOptions`). */
  options: unknown;
  /** UTXO shape; `never` for account-based models. */
  utxo: unknown;
}

/**
 * Account level API (ADR-064 Option 1). Stateless functions: the state and the history go through
 * stores the client provides, nothing is kept between calls. Every implementation delegates the
 * chain to a `CoinModuleApi`, so it holds no blockchain specific code.
 *
 * A call that refreshes the state (a sync, a read with `refresh`) does a read-modify-write of
 * `account.state`: the client serialises those calls on one account. A read without `refresh` only
 * reads it.
 */
export type AccountModuleApi<T extends AccountTypes = AccountTypes> = {
  /**
   * Brings the account up to date: refreshes every scope, puts each new state into
   * `account.state`, writes new operations to `account.history`.
   */
  sync: (
    context: Context<any>,
    account: AccountData<T["state"]>,
    options?: { signal?: AbortSignal },
  ) => AsyncIterable<SyncEvent>;

  // reads: from the stored state and history, no network call unless `refresh` is set

  /** Aggregated per asset, never per address or per UTXO. */
  getBalances: (
    context: Context<any>,
    account: AccountData<T["state"]>,
    options?: ReadOptions,
  ) => Promise<AccountRead<Balance[]>>;
  /** Newest first, pending ones included. */
  listOperations: (
    context: Context<any>,
    account: AccountData<T["state"]>,
    options?: { cursor?: Cursor; limit?: number } & ReadOptions,
  ) => Promise<AccountRead<Page<AccountOperation>>>;
  /** Operations not in a block yet: in the mempool, or broadcast and not seen. */
  getPendingOperations: (
    context: Context<any>,
    account: AccountData<T["state"]>,
    options?: ReadOptions,
  ) => Promise<AccountRead<AccountOperation[]>>;
  getStakes: (
    context: Context<any>,
    account: AccountData<T["state"]>,
    options?: ReadOptions,
  ) => Promise<AccountRead<Stake[]>>;
  /** UTXO models only. */
  getUTXOs?: (
    context: Context<any>,
    account: AccountData<T["state"]>,
    options?: { filter?: (utxo: T["utxo"]) => boolean } & ReadOptions,
  ) => Promise<AccountRead<T["utxo"][]>>;
  getAddresses: (
    context: Context<any>,
    account: AccountData<T["state"]>,
    options?: ReadOptions,
  ) => Promise<AccountRead<AccountAddress[]>>;
  /** Where to receive. */
  getFreshAddress: (
    context: Context<any>,
    account: AccountData<T["state"]>,
    options?: ReadOptions,
  ) => Promise<AccountRead<{ address: string; derivationPath: string }>>;

  // write path: from the stored state, which it does not refresh

  estimateFees: (
    context: Context<any>,
    account: AccountData<T["state"]>,
    intent: AccountIntent<T["options"]>,
    options?: AccountFeeOptions,
  ) => Promise<FeeEstimation>;
  validateIntent: (
    context: Context<any>,
    account: AccountData<T["state"]>,
    intent: AccountIntent<T["options"]>,
    options?: { customFees?: FeeEstimation },
  ) => Promise<TransactionValidation>;
  /** What a send-max intent would send. */
  estimateMaxSpendable: (
    context: Context<any>,
    account: AccountData<T["state"]>,
    intent: AccountIntent<T["options"]>,
    options?: AccountFeeOptions,
  ) => Promise<bigint>;
  craftTransaction: (
    context: Context<any>,
    account: AccountData<T["state"]>,
    intent: AccountIntent<T["options"]>,
    options?: { customFees?: FeeEstimation },
  ) => Promise<CraftedAccountTransaction>;
  combine: (
    context: Context<any>,
    account: AccountData<T["state"]>,
    crafted: CraftedAccountTransaction,
    signatures: string[],
    options?: { pubkey?: string },
  ) => Promise<string>;
  /** Broadcasts, then records the optimistic operation in the history. */
  broadcast: (
    context: Context<any>,
    account: AccountData<T["state"]>,
    signedTransaction: string,
    crafted: CraftedAccountTransaction,
    options?: { broadcastConfig?: BroadcastConfig },
  ) => Promise<AccountOperation>;
};
