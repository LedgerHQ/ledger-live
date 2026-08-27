import { useMemo } from "react";
import type { Account, AssetsDistribution } from "@ledgerhq/types-live";
import type { Currency } from "@domain/entity-currency";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { buildAssetDistribution } from "@ledgerhq/asset-aggregation/assetDistribution/index";
import { useChunkedAssetsData } from "@features/platform-aggregated-assets";

export type DistributionResult = AssetsDistribution & { isLoading: boolean };

export type DistributionOpts = {
  groupBy?: "currency" | "asset";
  showEmptyAccounts?: boolean;
  hideEmptyTokenAccount?: boolean;
};

export type AssetDistributionResult = {
  distribution: AssetsDistribution;
  isLoading: boolean;
};

export type UseAssetDistributionOpts = {
  accounts: Account[];
  to: Currency;
  product: "lld" | "llm";
  version: string;
  showEmptyAccounts?: boolean;
  hideEmptyTokenAccount?: boolean;
  skip?: boolean;
  currencyIds?: string[];
};

function collectAccountCurrencyIds(accounts: Account[]): string[] {
  const ids: string[] = [];
  const seen: Record<string, 1> = {};
  for (const account of accounts) {
    const currencyId = account.currency.id;
    if (!seen[currencyId]) {
      seen[currencyId] = 1;
      ids.push(currencyId);
    }
    const subs = account.subAccounts;
    if (!subs) continue;
    for (const sub of subs) {
      const tokenId = sub.token.id;
      if (!seen[tokenId]) {
        seen[tokenId] = 1;
        ids.push(tokenId);
      }
    }
  }
  return ids;
}

const emptyDistribution: AssetsDistribution = {
  isAvailable: false,
  list: [],
  showFirst: 0,
  sum: 0,
};

/**
 * Fetches DADA-powered asset data and builds a cross-network asset distribution.
 *
 * Designed to be composed with `useDistribution` from `live-countervalues-react`
 * by passing the result as the `assetDistribution` parameter.
 */
export function useAssetDistribution(opts: UseAssetDistributionOpts): AssetDistributionResult {
  const { accounts, to, product, version, skip = false, currencyIds, ...displayOpts } = opts;

  const cvState = useCountervaluesState();

  const accountCurrencyIds = useMemo(() => {
    if (skip) return [];
    if (currencyIds && currencyIds.length > 0) return currencyIds;
    return collectAccountCurrencyIds(accounts);
  }, [accounts, currencyIds, skip]);

  const {
    data: assetsData,
    isLoading: isChunkedLoading,
    isSuccess: isChunkedSuccess,
  } = useChunkedAssetsData({
    currencyIds: accountCurrencyIds,
    product,
    version,
    skip: skip || accountCurrencyIds.length === 0,
  });

  const distribution = useMemo<AssetsDistribution>(() => {
    if (skip || !isChunkedSuccess || !assetsData) {
      return emptyDistribution;
    }

    return buildAssetDistribution(accounts, cvState, to, assetsData, {
      showEmptyAccounts: !!displayOpts.showEmptyAccounts,
      hideEmptyTokenAccount: !!displayOpts.hideEmptyTokenAccount,
    });
  }, [
    skip,
    isChunkedSuccess,
    assetsData,
    accounts,
    cvState,
    to,
    displayOpts.showEmptyAccounts,
    displayOpts.hideEmptyTokenAccount,
  ]);

  return { distribution, isLoading: isChunkedLoading };
}
