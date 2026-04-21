import { useMemo } from "react";
import type { Account, AssetsDistribution } from "@ledgerhq/types-live";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import {
  buildAssetDistribution,
  type AssetsDataLike,
} from "@ledgerhq/asset-aggregation/assetDistribution/index";
import { flattenAccounts, getAccountCurrency } from "../account/helpers";
import { useChunkedAssetsData } from "../dada-client/hooks/useChunkedAssetsData";

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
};

const emptyDistribution: AssetsDistribution = {
  isAvailable: false,
  list: [],
  showFirst: 0,
  sum: 0,
};

const emptyAssetsData: AssetsDataLike = { cryptoAssets: {}, markets: {} };

/**
 * Fetches DADA-powered asset data and builds a cross-network asset distribution.
 *
 * Designed to be composed with `useDistribution` from `live-countervalues-react`
 * by passing the result as the `assetDistribution` parameter.
 */
export function useAssetDistribution(opts: UseAssetDistributionOpts): AssetDistributionResult {
  const { accounts, to, product, version, skip = false, ...displayOpts } = opts;

  const cvState = useCountervaluesState();

  const accountCurrencyIds = useMemo(() => {
    if (skip) return [];
    const ids = new Set(flattenAccounts(accounts).map(a => getAccountCurrency(a).id));
    return Array.from(ids);
  }, [accounts, skip]);

  const {
    data: assetsData,
    isLoading: isChunkedLoading,
    isSuccess: isChunkedSuccess,
    isError: isChunkedError,
  } = useChunkedAssetsData({
    currencyIds: accountCurrencyIds,
    product,
    version,
    skip: skip || accountCurrencyIds.length === 0,
  });

  const distribution = useMemo<AssetsDistribution>(() => {
    if (skip) return emptyDistribution;
    // Still in flight — avoid rendering with empty data
    if (!isChunkedSuccess && !isChunkedError) return emptyDistribution;
    // Graceful fallback: build from account data even when DADA API fails
    return buildAssetDistribution(accounts, cvState, to, assetsData ?? emptyAssetsData, {
      showEmptyAccounts: !!displayOpts.showEmptyAccounts,
      hideEmptyTokenAccount: !!displayOpts.hideEmptyTokenAccount,
    });
  }, [
    skip,
    isChunkedSuccess,
    isChunkedError,
    assetsData,
    accounts,
    cvState,
    to,
    displayOpts.showEmptyAccounts,
    displayOpts.hideEmptyTokenAccount,
  ]);

  return { distribution, isLoading: isChunkedLoading };
}
