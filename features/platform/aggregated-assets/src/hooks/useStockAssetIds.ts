import { useMemo } from "react";
import {
  useGetAssetCurrencyIdsByCategoryQuery,
  AssetCategory,
  type WalletApp,
} from "@domain/api-aggregated-assets";

const emptySet = new Set<string>();

export function useStockAssetIds(product: WalletApp, version: string, skip?: boolean) {
  const { data, isLoading, isError } = useGetAssetCurrencyIdsByCategoryQuery(
    {
      category: AssetCategory.Stocks,
      product,
      version,
    },
    { skip },
  );
  const ids = useMemo(() => (data ? new Set(data) : emptySet), [data]);
  return { ids, isLoading, isError };
}
