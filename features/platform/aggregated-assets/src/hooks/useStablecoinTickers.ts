import { useMemo } from "react";
import {
  useGetAssetsByCategoryQuery,
  AssetCategory,
  type WalletApp,
} from "@domain/api-aggregated-assets";

const emptySet = new Set<string>();

export function useStablecoinTickers(product: WalletApp, version: string, skip?: boolean) {
  const { data, isLoading, isError } = useGetAssetsByCategoryQuery(
    {
      category: AssetCategory.Stablecoins,
      product,
      version,
    },
    { skip },
  );
  const tickers = useMemo(
    () => (data ? new Set(data.map(t => t.toUpperCase())) : emptySet),
    [data],
  );
  return { tickers, isLoading, isError };
}
