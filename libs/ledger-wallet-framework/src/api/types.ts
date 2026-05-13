import type { AssetInfo, BalanceOptions } from "@ledgerhq/coin-module-framework/api/types";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Operation as LiveOperation } from "@ledgerhq/types-live";

export type ChainSpecificRules = {
  getAccountShape: (address: string) => void;
  getTransactionStatus: {
    throwIfPendingOperation?: boolean;
  };
};

export type BridgeApi = {
  getChainSpecificRules?: () => ChainSpecificRules;
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
};
