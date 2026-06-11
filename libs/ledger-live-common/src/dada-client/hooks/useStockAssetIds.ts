import { useMemo } from "react";
import { useGetAssetCurrencyIdsByCategoryQuery } from "../state-manager/api";
import { AssetCategory } from "../state-manager/types";

const emptySet = new Set<string>();

/**
 * Ledger currency ids of every tokenized stock (DADA `stocks` category). Used to
 * identify held stocks by id rather than ticker, which avoids symbol collisions
 * (e.g. a stock whose ticker equals a crypto ticker like TON).
 */
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
