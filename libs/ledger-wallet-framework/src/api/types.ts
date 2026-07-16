import type { AssetInfo, BalanceOptions } from "@ledgerhq/coin-module-framework/api/types";
import type { CryptoCurrency, TokenCurrency } from "../types";
import type {
  AccountReadiness,
  Operation as LiveOperation,
  StakingResources,
} from "@ledgerhq/types-live";

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
