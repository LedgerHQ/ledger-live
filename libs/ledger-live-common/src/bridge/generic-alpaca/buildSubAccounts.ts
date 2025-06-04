import type { TokenAccount, Account, SwapOperation } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { BalanceHistoryCache } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { buildTokenCurrency } from "./buildTokenCurrency";

/**
 * A minimal asset format compatible across chains that support tokens
 */
export type BaseTokenLikeAsset = {
  asset_code: string;
  asset_issuer: string; // NOTE: In Stellar, this is the public key of the account that created and controls the token.
  balance: string;
  decimals: number; // NOTE: check if necessary for all chains
};

export type StellarTokenLikeAsset = BaseTokenLikeAsset & {
  limit: string;
  buying_liabilities: string;
  selling_liabilities: string;
  is_authorized: boolean;
  is_authorized_to_maintain_liabilities: boolean;
  is_clawback_enabled: boolean;
};

// NOTE: Example for EVM-style assets
export type EvmTokenLikeAsset = BaseTokenLikeAsset & {
  contractAddress: string;
  symbol?: string;
};

/**
 * Shared argument type for building subAccounts.
 * Accepts any extension of BaseTokenLikeAsset.
 */
export type BuildSubAccountsArgs<T extends BaseTokenLikeAsset> = {
  currency: Account["currency"];
  accountId: string;
  assets: T[];
  operations?: TokenAccount["operations"];
  syncConfig?: Record<string, unknown>;
};

const emptyBalanceHistoryCache: BalanceHistoryCache = {
  HOUR: { latestDate: null, balances: [] },
  DAY: { latestDate: null, balances: [] },
  WEEK: { latestDate: null, balances: [] },
};

/**
 * Generic builder for Ledger Live TokenAccounts from token-like metadata.
 *
 * This is blockchain-agnostic. For per-chain logic, transform your token data
 * into the BaseTokenLikeAsset format (or its extensions), and call this.
 */
export function buildSubAccounts<T extends BaseTokenLikeAsset>({
  currency,
  accountId,
  assets,
  operations = [],
}: BuildSubAccountsArgs<T>): TokenAccount[] {
  return assets.map(asset => {
    const id = `${accountId}+${asset.asset_code}+${asset.asset_issuer}`;
    const balance = new BigNumber(asset.balance);

    const tokenCurrency: TokenCurrency = buildTokenCurrency({
      asset,
      parentCurrency: currency,
    });

    const tokenAccount: TokenAccount = {
      type: "TokenAccount",
      id,
      parentId: accountId,
      token: tokenCurrency,
      balance,
      spendableBalance: balance,
      creationDate: new Date(), // NOTE: For stellar, might want to replace with actual trustline creation time
      operations,
      operationsCount: operations.length,
      pendingOperations: [],
      balanceHistoryCache: emptyBalanceHistoryCache,
      swapHistory: [], // NOTE: Populated later in sync with swap logic if needed
    };

    return tokenAccount;
  });
}
