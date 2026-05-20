import { useSelector } from "LLD/hooks/redux";
import type { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import type { AssetMarketData } from "@ledgerhq/asset-detail";

export type MarketDataSectionCurrencyData = Readonly<{
  data?: MarketCurrencyData;
  showSkeleton: boolean;
  counterCurrency: string;
  locale: string;
}>;

export function useMarketDataSectionCurrencyData(
  marketData: AssetMarketData,
): MarketDataSectionCurrencyData {
  const counterCurrency = useSelector(counterValueCurrencySelector).ticker.toLowerCase();
  const locale = useSelector(localeSelector);

  return {
    data: marketData.marketCurrencyData,
    showSkeleton: !marketData.marketCurrencyData && marketData.isLoading,
    counterCurrency,
    locale,
  };
}
