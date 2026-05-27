import { useSelector } from "LLD/hooks/redux";
import type { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import type { AssetMarketData } from "@ledgerhq/asset-detail";
import { resolveAssetDetailSectionLoading } from "../../../utils/resolveAssetDetailSectionLoading";

export type MarketDataSectionCurrencyData = Readonly<{
  data?: MarketCurrencyData;
  showSkeleton: boolean;
  counterCurrency: string;
  locale: string;
}>;

export function useMarketDataSectionCurrencyData(
  marketData: AssetMarketData,
  isDistributionLoading: boolean,
): MarketDataSectionCurrencyData {
  const counterCurrency = useSelector(counterValueCurrencySelector).ticker.toLowerCase();
  const locale = useSelector(localeSelector);
  const hasData = marketData.marketCurrencyData != null;

  return {
    data: marketData.marketCurrencyData,
    showSkeleton: resolveAssetDetailSectionLoading(
      isDistributionLoading,
      marketData.isLoading,
      hasData,
    ),
    counterCurrency,
    locale,
  };
}
