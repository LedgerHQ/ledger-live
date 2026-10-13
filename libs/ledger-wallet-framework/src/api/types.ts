import type {
  AccountInfo,
  AssetInfo,
  BalanceOptions,
  CoinModuleApi,
  CraftedTransaction,
  Operation as CoinOperation,
  TransactionIntent,
  TxData,
} from "@ledgerhq/coin-module-framework/api/types";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import type { GetAddressResult } from "../derivation";
import type { AccountShapeInfo } from "../bridge/jsHelpers";
import type { SignerContext } from "../signer";
import type { CryptoCurrency, TokenCurrency } from "../types";
import type {
  Account,
  AccountReadiness,
  DerivationMode,
  Operation as LiveOperation,
  OperationType,
  SignRawOperationFnSignature,
  StakingResources,
  SyncConfig,
} from "@ledgerhq/types-live";
import type BigNumber from "bignumber.js";

export type OptimisticOperationDescriptor = {
  /** The operation type this mode produces. Absent defers to the generic mode mapping. */
  type?: OperationType;
  /**
   * The native value the operation records. Absent keeps the transaction amount — pass
   * `new BigNumber(0)` for a mode that only locks or releases the account's own funds, and the
   * chain-computed figure for a payout the transaction carries no amount for.
   */
  value?: BigNumber;
  /**
   * Family-owned `Operation.extra` keys for the pending row. Framework-reserved keys are dropped and
   * the framework's own applied last, so this cannot shadow them — the same contract a family bag
   * arriving from a sync goes through. The drop is unconditional while only `ledgerOpType`,
   * `blockTime` and `index` are written back, so a reserved key sent here (`memo`, `stake`, …) is
   * lost rather than merged. Needed by any family whose operation renderers read `extra`:
   * without it the pending row shows the type-level default until the next sync replaces it.
   */
  extra?: Record<string, unknown>;
};

/** @see BridgeApi.buildAccountShape — anything but a field of `Account`. */
export type FamilyAccountShape = Record<string, unknown> & Partial<Record<keyof Account, never>>;

export type ChainSpecificRules = {
  getAccountShape: (address: string) => void;
  getTransactionStatus: {
    throwIfPendingOperation?: boolean;
  };
};

export type AddressLookup = {
  /**
   * The addresses the device key `derived.publicKey` controls, in the order to offer them.
   *
   * `[]` ends the scan. If the wallet can create the account, return a placeholder instead: it
   * comes back unused and is offered as the new account.
   */
  getAddresses: (derived: GetAddressResult) => Promise<string[]>;
  /** Lets `receive()` verify the device offline. */
  keyControlsAccount: (publicKey: string, account: Account) => boolean;
};

/** What the generic bridge hands an {@link AccountLayer}: the coin module and its call context. */
export type AccountLayerDependencies = {
  /** The coin module, as the generic bridge resolves it (defaults backfilled). */
  api: CoinModuleApi<any, any, any>;
  context: Context<any>;
};

/** Device events a family signer reports while signing (bitcoin streams the previous transactions). */
export type AccountLayerDeviceEvents = {
  onDeviceStreaming: (event: { progress: number; index: number; total: number }) => void;
  onDeviceSignatureRequested: () => void;
  onDeviceSignatureGranted: () => void;
};

/**
 * For families whose account is not one address — a UTXO account is an extended public key whose
 * funds sit on many discovered addresses (ADR-065).
 *
 * `CoinModuleApi` answers per address. With this hook the generic bridge hands the account-wide
 * work to the family: the account shape (address discovery, history merge, balance), the account
 * context of each intent (coin selection, change, signing paths), and the pending operations rule.
 * Families without it are untouched.
 *
 * Interim: ADR-064 Option 1's account layer replaces this seam.
 */
export type AccountLayer = {
  /**
   * The whole account shape, keyed on the account key (the xpub), never on the fresh address. It
   * replaces the generic single-address sync, so it returns the full operation list
   * (`shouldMergeOps: false`).
   */
  getAccountShape: (
    info: AccountShapeInfo,
    syncConfig: SyncConfig,
    dependencies: AccountLayerDependencies & { signerContext: SignerContext<any> },
  ) => Promise<Partial<Account>>;
  /**
   * Adds what the intent needs from the whole account — for a UTXO family the selected inputs, the
   * change and the signing paths — before the generic bridge estimates, validates or crafts it.
   */
  completeIntent: (
    intent: TransactionIntent<any, any>,
    account: Account,
    transaction: Record<string, unknown>,
    dependencies: AccountLayerDependencies,
  ) => Promise<TransactionIntent<any, any>>;
  /** Replaces the generic post-sync, whose pending operations rule assumes an account nonce. */
  postSync: (initial: Account, synced: Account) => Account;
  /** Completes the optimistic operation from the crafted transaction (real senders, spent inputs). */
  decorateOptimisticOperation?: (
    operation: LiveOperation,
    crafted: CraftedTransaction,
    account: Account,
    transaction: Record<string, unknown>,
  ) => LiveOperation;
  /** Address parameters of the swap/exchange flow, when the family's differ from the default. */
  getSerializedAddressParameters?: (account: Account, addressFormat?: string) => Buffer;
};

/** An address of a multi-address account, on its HD chain (BIP44: 0 receives, 1 is change). */
export type AccountAddress = { address: string; chain: number; index: number };

/** What the multi-address engine keeps between syncs; a family extends it with its own part. */
export type MultiAddressAccountState = {
  /** Version of the family's state schema: a state of another version is not trusted. */
  version: number;
  /** Chain tip at the last sync; the next one resumes `rewindBlocks` below it. */
  syncedHeight: number;
  /** Highest block holding a transaction of the account, to detect reorgs. */
  anchor: { height: number; hash: string } | null;
  /** Every address of the account that holds history. */
  addresses: AccountAddress[];
};

/** A transaction of the account, as the family reads it from a `listOperations` operation. */
export type AccountTransaction = {
  id: string;
  /** `null` while in the mempool. */
  block: { height: number; hash: string } | null;
};

/** The addresses of an account, as a family needs them to build a transaction. */
export type AccountAddressBook = {
  /** e.g. "84'/0'/0'". */
  accountPath: string;
  addresses: AccountAddress[];
  pathOf: (address: Pick<AccountAddress, "chain" | "index">) => string;
  /** The first address of `chain` above the highest one holding history. */
  next: (chain: number) => Promise<{ address: string; path: string }>;
};

/**
 * A family whose account is an extended public key with its funds on many addresses (ADR-065).
 *
 * The generic multi-address engine owns what any such account needs: the account key and id,
 * the gap walk over its address chains, the history of each address (`listOperations`), the
 * reorg anchor, the generic state and the fresh address. The family brings what its chain means:
 * deriving addresses, reading a transaction, interpreting it into operations, its accounting
 * (UTXOs for bitcoin) and what an intent needs from the whole account.
 *
 * Interim: it maps onto ADR-064 Option 1's `AccountApi`, which replaces it.
 */
export type MultiAddressAccountFamily<
  Tx extends AccountTransaction = AccountTransaction,
  State extends MultiAddressAccountState = MultiAddressAccountState,
> = {
  /** Address chains walked at sync. */
  chains: readonly number[];
  /** The chain the fresh (receive) address comes from. */
  receiveChain: number;
  /** Unused addresses walked past the last used one, per chain. */
  gapLimit: number;
  /** Blocks re-read below the last synced tip, so a replaced block is not missed. */
  rewindBlocks: number;

  /** The key the account is built on, read on the device: its extended public key. */
  getAccountKey: (
    request: { currencyId: string; accountPath: string; deviceId: string | undefined },
    signerContext: SignerContext<any>,
  ) => Promise<string>;
  /** The addresses of an account key. */
  addressDeriver: (
    currencyId: string,
    derivationMode: DerivationMode,
    key: string,
  ) => (chain: number, index: number) => Promise<string>;
  /** An address as the account shows it. Default: unchanged. */
  displayAddress?: (currencyId: string, address: string) => string;

  /** The transaction a `listOperations` operation carries (in its `details`). */
  transactionOf: (operation: CoinOperation<any>) => Tx;

  /** The state persisted with the account, validated (or migrated); `undefined` when there is none. */
  readState: (account: Account | undefined) => State | undefined;
  emptyState: () => State;
  /** The error a transaction of an account without state raises. */
  resyncError: () => Error;

  /** The operations of the account, each transaction interpreted against all its addresses. */
  interpret: (
    transactions: Tx[],
    context: { currencyId: string; accountId: string; addresses: AccountAddress[] },
  ) => LiveOperation[];
  /**
   * The family's accounting of a sync. `state` already carries this sync's engine fields;
   * `operations` is the merged list. Returns the family's state, the operations it keeps, the
   * balances and the account fields that persist the state.
   */
  settle: (input: {
    currencyId: string;
    state: State;
    confirmed: Tx[];
    pending: Tx[];
    operations: LiveOperation[];
  }) => {
    state: State;
    operations: LiveOperation[];
    balance: BigNumber;
    spendableBalance: BigNumber;
    accountFields: Partial<Account>;
  };

  /** Adds what the intent needs from the whole account (inputs, change, signing paths). */
  completeIntent: (
    intent: TransactionIntent<any, any>,
    account: Account,
    transaction: Record<string, unknown>,
    dependencies: AccountLayerDependencies & { addressBook: AccountAddressBook },
  ) => Promise<TransactionIntent<any, any>>;
  /** A pending operation settled although its own transaction is not on chain (replaced). */
  isPendingSettled?: (pending: LiveOperation, synced: Account) => boolean;
  /** The synced operation of a sent transaction, completed from its optimistic one. */
  mergeSentOperation?: (synced: LiveOperation, optimistic: LiveOperation) => LiveOperation;
  decorateOptimisticOperation?: AccountLayer["decorateOptimisticOperation"];
  getSerializedAddressParameters?: AccountLayer["getSerializedAddressParameters"];
};

export type BridgeApi = {
  getChainSpecificRules?: ChainSpecificRules;
  getTokenFromAsset?: (asset: AssetInfo) => Promise<TokenCurrency | undefined>;
  getAssetFromToken?: (token: TokenCurrency, owner: string) => AssetInfo | undefined;
  computeIntentType?: (transaction: Record<string, unknown>) => string;
  /**
   * Maps the family's own transaction fields onto the intent's `data` (the coin module's `TxData`);
   * the generic layer never inspects the result. Absent leaves `data` to the coin module's own
   * `craftTransactionData`; present, it replaces that call for every mode — plain sends included.
   */
  buildIntentData?: (transaction: Record<string, unknown>) => TxData;
  /**
   * Reinterprets a *generic* mode for one family, so the framework doesn't branch on it. `mode` is a
   * `GENERIC_TRANSACTION_MODE` value — family-specific modes stay out of that union by design.
   * Returning `undefined` keeps generic behaviour.
   *
   * Exists so the pending row's type matches the type the subsequent sync produces, rather than
   * relabelling itself once the sync resolves the chain's real type.
   *
   * Scoped to `signOperation`. `signRawOperation` builds its optimistic row from a pre-crafted blob
   * that carries no mode, so there is nothing for this hook to reinterpret there.
   */
  describeOptimisticOperation?: (
    mode: string,
    account: Account,
    transaction: Record<string, unknown>,
  ) => OptimisticOperationDescriptor | undefined;
  /**
   * Extra facts this family's device app needs alongside the unsigned payload — passed straight
   * through as the third argument to `signer.signTransaction`, never interpreted by the framework.
   *
   * Spread over the framework's own device options, so a family can override `recipientDomain` — its
   * device app is the authority on what that app needs. `derivationMode` is pinned after it though:
   * tezos selects its signing curve from that option (`families/tezos/signer.ts`), and a device signs
   * the wrong curve without complaining.
   */
  getDeviceSignOptions?: (
    transaction: Record<string, unknown>,
    account: Account,
  ) => Record<string, unknown> | undefined;
  /** Replaces the generic raw signing (craft, sign, combine) with the family's own. */
  signRawOperation?: SignRawOperationFnSignature<Account>;
  /**
   * Family-owned account fields with no generic equivalent — `stakingResources`, `stakingPositions`,
   * whatever the family names — passed through without the framework inspecting them, hence the index
   * signature. No field of `Account` may appear: pinning the ones the account shape sets is not
   * enough, because `jsHelpers` merges `{ ...account, …derived, ...shape }` and re-pins only
   * `operations` and `pendingOperations`, so a field the shape leaves unset — `freshAddress`,
   * `currency`, `derivationMode` — would reach the persisted account straight from here. `keyof
   * Account` rather than a list of names so a field added upstream is covered the day it lands;
   * anything a later `postSync` fills is unprotected.
   *
   * `accountInfo` is the coin module's own `getAccountInfo` output (ADR-045), `undefined` when the
   * module does not implement it. This hook is the *mapper*: the framework performs the standard
   * call, and the family decides which of its own account fields that metadata feeds, so nothing
   * chain-shaped reaches the generic account. A family whose account fields need more than
   * `getAccountInfo` exposes fetches the remainder here.
   *
   * A rejection fails the sync, leaving the last good account in place for the next poll to retry —
   * the framework cannot know whether these fields are load-bearing for the family. Return
   * `undefined` (catching inside the hook) for a contribution the account is correct without. That
   * only covers what this hook does itself: the `getAccountInfo` call feeding it is awaited first, so
   * a rejection there fails the sync without ever reaching the hook.
   */
  buildAccountShape?: (
    address: string,
    accountInfo?: AccountInfo,
  ) => Promise<FamilyAccountShape | undefined> | FamilyAccountShape | undefined;
  /** Family-specific token sub-account fields, keyed by the token's `contractAddress`. */
  buildTokenAccountShapes?: (
    address: string,
  ) => Promise<Record<string, FamilyAccountShape>> | Record<string, FamilyAccountShape>;
  refreshOperations?: (operations: LiveOperation[]) => Promise<LiveOperation[]>;
  adaptOperations?: (address: string, operations: LiveOperation[]) => LiveOperation[];
  validateTransaction?: (signature: string) => Promise<{ error: Error | undefined }>;
  /**
   * When true, `signOperation` forwards the last estimation's `FeeEstimation.parameters` (carried on
   * `GenericTransaction.feeParameters`) into the `customFees.parameters` bag it hands
   * `craftTransaction` — the way `getTransactionStatus` already does for `validateIntent`.
   *
   * Opt-in per family rather than always-on: that bag reaches `craftTransaction` on every send, so a
   * family whose crafting reads a key its own estimation also emits would change behaviour with no
   * type error. Needed where a chain field is a *ceiling* rather than a fee, which
   * `FeeEstimation.value` cannot supply — `value` is the net fee, and pinning TRON's TRC-20
   * `fee_limit` to it reverts OUT_OF_ENERGY once the sender's energy covers the transfer
   * (LIVE-36865).
   */
  forwardsFeeParametersToCraft?: boolean;
  /**
   * Whether the chain surfaces staking data through `getBalance`
   */
  stakingSupported?: boolean;
  /**
   * When true, the chain consumes per-stake positions via
   * `account.stakingPositions` (raw `Stake[]` from `getBalance`) instead of
   * the EVM-style `stakingResources` aggregate. Used by chains where each
   * stake position must be preserved individually (e.g., Tezos Paris upgrade
   * distinguishes delegation vs staking vs unstaking via uid prefix).
   */
  usesStakingPositions?: boolean;
  /**
   * When true, the account balance and locked amount sum all native `getBalance` entries (Tezos).
   * Opt-in: Solana's stakes overlap the first native entry; EVM's are extra and carry no `locked`.
   */
  partitionsNativeBalance?: boolean;
  balanceOptions?: BalanceOptions;
  /**
   * Optional hook called after operations are merged, allowing a chain bridge to
   * enrich the staking resources built from `getBalance` data (e.g. by fetching
   * redelegations from a REST API or reconstructing them from on-chain tx history
   * when the standard API does not surface them).
   *
   * @param currency - The crypto currency of the account being synced.
   * @param address - The account address.
   * @param operations - The full merged operation list.
   * @param stakingResources - The current staking resources to enrich.
   * @returns The enriched staking resources, or the same object unchanged when no enrichment is needed.
   */
  enrichStakingResources?: (
    currency: CryptoCurrency,
    address: string,
    operations: LiveOperation[],
    stakingResources: StakingResources,
  ) => Promise<StakingResources>;
  /**
   * Optional hook returning the account's generic readiness projection, written to
   * `account.readiness` during sync. Omit for chains with no readiness concept — the
   * field is then left undefined (consumers treat undefined as ready/unknown).
   *
   * @param currency - The crypto currency of the account being synced.
   * @param address - The account address.
   * @returns The readiness of the account (ready flag + optional reason).
   */
  getAccountReadiness?: (currency: CryptoCurrency, address: string) => Promise<AccountReadiness>;
  /**
   * For chains whose address is handed out by the network, not derived from the path (ADR-055).
   * When present, scan asks it for the addresses a device key controls, and `receive()` verifies the
   * device through `keyControlsAccount`.
   */
  addressLookup?: AddressLookup;
  /**
   * Defaults to `true`. Set `false` when the account shape returns the whole operation list, or the
   * merge puts back the operations the shape left out.
   */
  shouldMergeOps?: boolean;
  /**
   * Added to `syncHash`: an account stored under another hash resyncs from scratch, replacing its
   * operations. For a bridge whose operation ids differ from those another bridge stored.
   */
  syncVersion?: string;
  /**
   * For a family whose legacy bridge keyed account ids on the public key rather than the address.
   * When true, a synced account keeps the `xpubOrAddress` already in its id, and a scanned one is
   * keyed on the device's public key, so moving to the generic bridge never re-keys an account.
   */
  accountIdFromPublicKey?: boolean;
  /** @see AccountLayer */
  accountLayer?: AccountLayer;
};
