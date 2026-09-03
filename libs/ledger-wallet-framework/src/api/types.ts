import type {
  AccountInfo,
  AssetInfo,
  BalanceOptions,
  TxData,
} from "@ledgerhq/coin-module-framework/api/types";
import type { CryptoCurrency, TokenCurrency } from "../types";
import type {
  Account,
  AccountReadiness,
  Operation as LiveOperation,
  OperationType,
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
  /**
   * The same for token sub-accounts, keyed by contract address — `Balance` has no room for what a
   * chain's token accounts hold beyond an amount. Declare `assignFrom/ToTokenAccountRaw` alongside
   * it, or what this builds is lost on reload. A rejection fails the sync, as for
   * `buildAccountShape`: catch inside the hook for fields the accounts are correct without.
   */
  buildTokenAccountShapes?: (
    address: string,
  ) => Promise<Record<string, FamilyAccountShape>> | Record<string, FamilyAccountShape>;
  refreshOperations?: (operations: LiveOperation[]) => Promise<LiveOperation[]>;
  validateTransaction?: (signature: string) => Promise<{ error: Error | undefined }>;
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
};
