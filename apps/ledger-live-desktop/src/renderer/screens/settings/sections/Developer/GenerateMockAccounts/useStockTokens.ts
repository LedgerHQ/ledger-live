import { useMemo } from "react";
import { useStocksData } from "@ledgerhq/live-common/dada-client/hooks/useStocksData";
import { selectTopStocks } from "@ledgerhq/live-common/dada-client/utils/assetDiscovery";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";

export const MAX_STOCK_TOKENS = 20;

export interface StockTokensResult {
  tokensByParent: { parentId: string; tokens: TokenCurrency[] }[];
  loading: boolean;
}

export function useStockTokens(enabled = true): StockTokensResult {
  const { data, isLoading } = useStocksData({
    product: "lld",
    version: __APP_VERSION__,
    skip: !enabled,
  });

  const tokensByParent = useMemo(() => {
    if (!data) return [];

    const groups = new Map<string, TokenCurrency[]>();
    for (const { ledgerId } of selectTopStocks(data, MAX_STOCK_TOKENS)) {
      const currency = data.cryptoOrTokenCurrencies[ledgerId];
      if (!currency || currency.type !== "TokenCurrency") continue;
      const parentId = currency.parentCurrencyId;
      groups.set(parentId, [...(groups.get(parentId) ?? []), currency]);
    }

    return Array.from(groups, ([parentId, tokens]) => ({ parentId, tokens }));
  }, [data]);

  return { tokensByParent, loading: enabled && isLoading };
}
