import { useMemo } from "react";
import type { Account, AssetsDistribution } from "@ledgerhq/types-live";
import type { Currency } from "@domain/entity-currency";
import { useCountervaluesCache } from "@features/platform-market-countervalues";
import { buildAssetDistribution } from "@ledgerhq/asset-aggregation/assetDistribution/index";
import { flattenAccounts, getAccountCurrency } from "../account/helpers";
import { useChunkedAssetsData } from "@features/platform-aggregated-assets";

export type DistributionResult = AssetsDistribution & { isLoading: boolean };

export type DistributionOpts = {
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
};

const emptyDistribution: AssetsDistribution = {
  isAvailable: false,
  list: [],
  showFirst: 0,
  sum: 0,
};

/**
 * Fetches DADA-powered asset data and builds a cross-network asset distribution.
 */
export function useAssetDistribution(opts: UseAssetDistributionOpts): AssetDistributionResult {
  const { accounts, to, product, version, ...displayOpts } = opts;

  const cvState = useCountervaluesCache();

  const accountCurrencyIds = useMemo(() => {
    const ids = new Set(flattenAccounts(accounts).map(a => getAccountCurrency(a).id));
    return Array.from(ids);
  }, [accounts]);

  const {
    data: assetsData,
    isLoading: isChunkedLoading,
    isSuccess: isChunkedSuccess,
  } = useChunkedAssetsData({
    currencyIds: accountCurrencyIds,
    product,
    version,
    skip: accountCurrencyIds.length === 0,
  });

  const distribution = useMemo<AssetsDistribution>(() => {
    if (!isChunkedSuccess || !assetsData) {
      return emptyDistribution;
    }

    return buildAssetDistribution(accounts, cvState, to, assetsData, {
      showEmptyAccounts: !!displayOpts.showEmptyAccounts,
      hideEmptyTokenAccount: !!displayOpts.hideEmptyTokenAccount,
    });
  }, [
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
