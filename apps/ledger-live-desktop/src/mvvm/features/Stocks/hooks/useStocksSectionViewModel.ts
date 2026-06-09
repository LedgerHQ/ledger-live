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

  // DADA already returns stocks ordered by market cap (currenciesOrder), so we only cap
  // the number of rows and map each meta-currency to the fields the row needs.
  const stocks = useMemo<StockSuggestion[]>(() => {
    if (!data) return [];
    const { cryptoAssets, markets, currenciesOrder } = data;
    return currenciesOrder.metaCurrencyIds
      .flatMap(id => {
        const meta = cryptoAssets[id];
        if (!meta) return [];

        // Mirror the Assets section: resolve the best representation for the meta-currency,
        // then read its market entry. DADA `markets` is keyed by ledger currency id — not
        // meta-currency id — so we must look it up via the resolved currency.
        const currency = selectCurrencyForMetaId(id, data);
        const ledgerId = currency?.id ?? Object.values(meta.assetsIds)[0];
        const market = currency ? markets[currency.id] : undefined;

        const stock: StockSuggestion = {
          id: meta.id,
          name: meta.name,
          ticker: meta.ticker,
          // The asset/market detail resolves market data via the `markets?ids=` endpoint,
          // which expects a CoinGecko slug — not a ledger currency id. Derive it from the
          // DADA market id when present, else from the meta-currency id (same as Assets).
          navigationId: dadaIdToMarketId(market?.id ?? meta.id),
          ledgerId,
        };
        return [stock];
      })
      .slice(0, limit);
  }, [data, limit]);

  return useMemo(() => ({ data: stocks, isLoading }), [stocks, isLoading]);
}
