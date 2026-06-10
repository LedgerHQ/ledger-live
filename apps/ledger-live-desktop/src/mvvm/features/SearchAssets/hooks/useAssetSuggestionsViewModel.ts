import { useMemo } from "react";
import { useMarketData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { useStablecoinTickers } from "@ledgerhq/live-common/dada-client/hooks/useStablecoinTickers";
import { MarketCurrencyData, Order } from "@ledgerhq/live-common/market/utils/types";
import { useSelector } from "LLD/hooks/redux";
import { marketParamsSelector } from "~/renderer/reducers/market";
import { AssetSuggestionsViewModelResult } from "../types";

const MARKET_FETCH_LIMIT = 50;

export function useAssetSuggestionsViewModel({
  cryptosLimit,
  stablecoinsLimit,
}: {
  cryptosLimit: number;
  stablecoinsLimit: number;
}): AssetSuggestionsViewModelResult {
  const { counterCurrency } = useSelector(marketParamsSelector);

  const market = useMarketData({
    counterCurrency,
    range: "24h",
    order: Order.MarketCapDesc,
    page: 1,
    limit: MARKET_FETCH_LIMIT,
  });

  const { tickers, isLoading: tickersLoading } = useStablecoinTickers("lld", __APP_VERSION__);

  const isLoading = market.isLoading || tickersLoading;

  const { cryptos, stablecoins } = useMemo(() => {
    const cryptosData: MarketCurrencyData[] = [];
    const stablecoinsData: MarketCurrencyData[] = [];

    for (const currency of market.data) {
      const isStablecoin = tickers.has(currency.ticker.toUpperCase());
      const [bucket, bucketLimit] = isStablecoin
        ? [stablecoinsData, stablecoinsLimit]
        : [cryptosData, cryptosLimit];
      if (bucket.length < bucketLimit) bucket.push(currency);
      if (cryptosData.length >= cryptosLimit && stablecoinsData.length >= stablecoinsLimit) break;
    }

    return { cryptos: cryptosData, stablecoins: stablecoinsData };
  }, [market.data, tickers, cryptosLimit, stablecoinsLimit]);

  return useMemo(
    () => ({
      cryptos: { data: cryptos, isLoading },
      stablecoins: { data: stablecoins, isLoading },
    }),
    [cryptos, stablecoins, isLoading],
  );
}
