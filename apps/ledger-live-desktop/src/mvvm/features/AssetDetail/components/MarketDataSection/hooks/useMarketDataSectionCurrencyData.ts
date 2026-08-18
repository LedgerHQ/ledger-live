import { useSelector } from "LLD/hooks/redux";
import type { Unit } from "@domain/entity-currency-unit";
import type { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import type { AssetMarketData } from "@ledgerhq/asset-detail";
import { resolveAssetDetailSectionLoading } from "../../../utils/resolveAssetDetailSectionLoading";

export type MarketDataSectionCurrencyData = Readonly<{
  data?: MarketCurrencyData;
  showSkeleton: boolean;
  counterCurrency: string;
  counterValueUnit: Unit;
  locale: string;
  ledgerCurrencyId?: string;
}>;

export function useMarketDataSectionCurrencyData(
  marketData: AssetMarketData,
  isDistributionLoading: boolean,
  ledgerCurrencyId?: string,
): MarketDataSectionCurrencyData {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const counterCurrency = counterValueCurrency.ticker.toLowerCase();
  const counterValueUnit = counterValueCurrency.units[0];
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
    counterValueUnit,
    locale,
    ledgerCurrencyId,
  };
}
