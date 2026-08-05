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
};

export type ChainSpecificRules = {
  getAccountShape: (address: string) => void;
  getTransactionStatus: {
    throwIfPendingOperation?: boolean;
  };
};

export type BridgeApi = {
  getChainSpecificRules?: ChainSpecificRules;
  getTokenFromAsset?: (asset: AssetInfo) => Promise<TokenCurrency | undefined>;
  getAssetFromToken?: (token: TokenCurrency, owner: string) => AssetInfo;
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
   */
  describeOptimisticOperation?: (
    mode: string,
    account: Account,
  ) => OptimisticOperationDescriptor | undefined;
  /**
   * Extra facts this family's device app needs alongside the unsigned payload — passed straight
   * through as the third argument to `signer.signTransaction`, never interpreted by the framework.
   *
   * Unlike every other bag on this type, this one is spread *last* onto the framework's own device
   * options, so a family can override `derivationMode` and `recipientDomain`. Deliberate: the family
   * owns its own device app, and a wrong signing option fails loudly at the device rather than
   * silently corrupting stored state.
   */
  getDeviceSignOptions?: (
    transaction: Record<string, unknown>,
    account: Account,
  ) => Record<string, unknown> | undefined;
  /**
   * Family-owned account fields with no generic equivalent. The returned record is spread first into
   * the account shape, so it cannot override the fields that shape sets explicitly. It *can* still
   * land on a field nothing else assigns on that path — `stakingResources` and `stakingPositions` are
   * only occupied when staking is enabled, and anything a later `postSync` fills is unprotected. The
   * record is untyped by design, since the framework never inspects it.
   *
   * `accountInfo` is the coin module's own `getAccountInfo` output (ADR-045), `undefined` when the
   * module does not implement it. This hook is the *mapper*: the framework performs the standard
   * call, and the family decides which of its own account fields that metadata feeds, so nothing
   * chain-shaped reaches the generic account. A family whose account fields need more than
   * `getAccountInfo` exposes fetches the remainder here.
   */
  buildAccountShape?: (
    address: string,
    accountInfo?: AccountInfo,
  ) => Promise<Record<string, unknown> | undefined> | Record<string, unknown> | undefined;
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
