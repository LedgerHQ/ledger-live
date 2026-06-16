import { useMemo } from "react";
import VersionNumber from "react-native-version-number";
import { useStocksData } from "@ledgerhq/live-common/dada-client/hooks/useStocksData";
import { selectTopStocks } from "@ledgerhq/live-common/dada-client/utils/assetDiscovery";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { MAX_STOCK_TOKENS } from "../constants";

export interface StockTokensResult {
  tokensByParent: { parentId: string; tokens: TokenCurrency[] }[];
  loading: boolean;
}

export function useStockTokens(enabled = true): StockTokensResult {
  const version = VersionNumber.appVersion ?? "";
  const { data, isLoading } = useStocksData({ product: "llm", version, skip: !enabled });

  const tokensByParent = useMemo(() => {
    if (!data) return [];

    const groups = new Map<string, TokenCurrency[]>();
    for (const { ledgerId } of selectTopStocks(data, MAX_STOCK_TOKENS)) {
      const currency = data.cryptoOrTokenCurrencies[ledgerId];
      if (currency?.type !== "TokenCurrency") continue;
      const parentId = currency.parentCurrencyId;
      groups.set(parentId, [...(groups.get(parentId) ?? []), currency]);
    }

    return Array.from(groups, ([parentId, tokens]) => ({ parentId, tokens }));
  }, [data]);

  return { tokensByParent, loading: enabled && isLoading };
}
