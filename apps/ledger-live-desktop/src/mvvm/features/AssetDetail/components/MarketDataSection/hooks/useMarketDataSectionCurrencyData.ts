import { useSelector } from "LLD/hooks/redux";
import type { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import type { AssetMarketData } from "@ledgerhq/asset-detail";

export type MarketDataSectionCurrencyData = Readonly<{
  data: MarketCurrencyData | undefined;
  showSkeleton: boolean;
  counterCurrency: string;
  locale: string;
}>;

export function useMarketDataSectionCurrencyData(
  market: AssetMarketData,
): MarketDataSectionCurrencyData {
  const counterCurrency = useSelector(counterValueCurrencySelector).ticker.toLowerCase();
  const locale = useSelector(localeSelector);

  return {
    data: market.marketCurrencyData,
    showSkeleton: !market.marketCurrencyData && market.isLoading,
    counterCurrency,
    locale,
  };
}
