import { useMemo } from "react";
import { useStocksData as __tmp__useStocksData } from "@ledgerhq/live-common/dada-client/hooks/useStocksData";
import { selectTopStocks } from "@ledgerhq/live-common/dada-client/utils/assetDiscovery";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { TokenCurrency } from "@domain/entity-currency-token";

type UseStocksDataResult = {
  data:
    | (Omit<
        NonNullable<ReturnType<typeof __tmp__useStocksData>["data"]>,
        "cryptoOrTokenCurrencies"
      > & { cryptoOrTokenCurrencies: Record<string, CryptoOrTokenCurrency> })
    | undefined;
  isLoading: boolean;
};

// Single `as` safe: brands id fields; structural shape unchanged.
// Drop when dada-client migrates to domain types.
function useStocksData(args: Parameters<typeof __tmp__useStocksData>[0]): UseStocksDataResult {
  return __tmp__useStocksData(args) as UseStocksDataResult;
}

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
      groups.set(currency.parentCurrencyId, [
        ...(groups.get(currency.parentCurrencyId) ?? []),
        currency,
      ]);
    }

    return Array.from(groups, ([parentId, tokens]) => ({ parentId, tokens }));
  }, [data]);

  return { tokensByParent, loading: enabled && isLoading };
}
