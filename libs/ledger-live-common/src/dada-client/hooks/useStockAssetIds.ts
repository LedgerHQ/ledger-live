import { useMemo } from "react";
import { useGetAssetCurrencyIdsByCategoryQuery } from "../state-manager/api";
import { AssetCategory } from "../state-manager/types";

const emptySet = new Set<string>();

export function useStockAssetIds(product: "llm" | "lld", version: string, skip?: boolean) {
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
