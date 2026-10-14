import type {
  AccountInfo,
  AssetInfo,
  BalanceOptions,
  CoinModuleApi,
  TxData,
} from "@ledgerhq/coin-module-framework/api/types";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import type {
  AccountData,
  AccountModuleApi,
  AccountOperation,
  CraftedAccountTransaction,
  Versioned,
} from "@ledgerhq/account-module-framework";
import type { GetAddressResult } from "../derivation";
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

/** Device events a family signer reports while signing (bitcoin streams the previous transactions). */
export type SignerDeviceEvents = {
  onDeviceStreaming: (event: { progress: number; index: number; total: number }) => void;
  onDeviceSignatureRequested: () => void;
  onDeviceSignatureGranted: () => void;
};

/** What a binding reads once an account is synced, to fill the family fields of the account. */
export type SyncedAccountModule = {
  module: AccountModuleApi<any>;
  context: Context<any>;
  account: AccountData<any>;
};

/**
 * A family whose accounts are served by an account module (ADR-064 Option 1): the generic bridge
 * syncs, completes intents and crafts through the module, which owns the account (every address,
 * its history, its state) and delegates the chain to the coin module. What stays here is the
 * Ledger Wallet side of the family: the device, the persistence and the presentation.
 */
export type AccountModuleBinding = {
  /** The account module of a currency, on the coin module the generic bridge resolves. */
  create: (coinModuleApi: CoinModuleApi<any, any, any>, currencyId: string) => AccountModuleApi<any>;
  /** The account key read on the device (the extended public key of a UTXO account). */
  getAccountKey: (
    request: {
      currencyId: string;
      /** Account level, e.g. "84'/0'/0'". */
      derivationPath: string;
      derivationMode: DerivationMode;
      deviceId: string | undefined;
    },
    signerContext: SignerContext<any>,
  ) => Promise<string>;
  /** The module state the account persists; `undefined` when it has none. */
  readState: (account: Account | undefined) => Versioned | undefined;
  /** The family fields of a synced account (its resources, the state to persist, ...). */
  accountFields: (synced: SyncedAccountModule) => Promise<Partial<Account>>;
  /** Module options of the write path, from the family transaction (coin control, replacement). */
  accountOptions?: (transaction: Record<string, unknown>) => unknown;
  /** Completes the generic mapping of an account operation to a Ledger Wallet operation. */
  toLiveOperation?: (operation: AccountOperation, live: LiveOperation) => LiveOperation;
  /** A pending operation settled although its own transaction is not on chain (replaced). */
  isPendingSettled?: (pending: LiveOperation, synced: Account) => boolean;
  /** The synced operation of a sent transaction, completed from its optimistic one. */
  mergeSentOperation?: (synced: LiveOperation, optimistic: LiveOperation) => LiveOperation;
  /** Completes the optimistic operation with what only the family shows. */
  decorateOptimisticOperation?: (
    operation: LiveOperation,
    crafted: CraftedAccountTransaction,
    account: Account,
    transaction: Record<string, unknown>,
  ) => LiveOperation;
  /** Address parameters of the swap/exchange flow, when the family's differ from the default. */
  getSerializedAddressParameters?: (account: Account, addressFormat?: string) => Buffer;
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
  /** @see AccountModuleBinding */
  accountModule?: AccountModuleBinding;
};
