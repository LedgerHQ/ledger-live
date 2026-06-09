import { useMemo } from "react";
import { useStocksData } from "@ledgerhq/live-common/dada-client/hooks/useStocksData";
import { selectCurrencyForMetaId } from "@ledgerhq/live-common/dada-client/utils/currencySelection";
import { dadaIdToMarketId } from "@ledgerhq/live-common/market/utils/index";
import { StockSuggestion, StocksSectionViewModelResult } from "../types";

export function useStocksSectionViewModel({
  limit,
}: {
  limit: number;
}): StocksSectionViewModelResult {
  const { data, isLoading } = useStocksData({
    product: "lld",
    version: __APP_VERSION__,
    isStaging: true,
  });

  const stocks = useMemo<StockSuggestion[]>(() => {
    if (!data) return [];
    const { cryptoAssets, markets, currenciesOrder } = data;
    return currenciesOrder.metaCurrencyIds
      .flatMap(id => {
        const meta = cryptoAssets[id];
        if (!meta) return [];

        const currency = selectCurrencyForMetaId(id, data);
        const ledgerId = currency?.id ?? Object.values(meta.assetsIds)[0];
        if (!ledgerId) return [];
        const market = currency ? markets[currency.id] : undefined;

        const stock: StockSuggestion = {
          id: meta.id,
          name: meta.name,
          ticker: meta.ticker,

          navigationId: dadaIdToMarketId(market?.id ?? meta.id),
          ledgerId,
        };
        return [stock];
      })
      .slice(0, limit);
  }, [data, limit]);

  return useMemo(() => ({ data: stocks, isLoading }), [stocks, isLoading]);
}
