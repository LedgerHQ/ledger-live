import { useMemo } from "react";
import { useGetAssetsByCategoryQuery } from "../state-manager/api";
import { AssetCategory } from "../state-manager/types";

const emptySet = new Set<string>();

export function useStablecoinTickers(product: "llm" | "lld", version: string) {
  const { data, isLoading } = useGetAssetsByCategoryQuery({
    category: AssetCategory.Stablecoins,
    product,
    version,
  });
  const tickers = useMemo(
    () => (data ? new Set(data.map(t => t.toUpperCase())) : emptySet),
    [data],
  );
  return { tickers, isLoading };
}
