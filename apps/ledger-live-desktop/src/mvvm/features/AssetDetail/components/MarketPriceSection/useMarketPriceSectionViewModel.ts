import { useCallback, useMemo } from "react";
import type { AssetMarketData } from "@ledgerhq/asset-detail";
import type { DistributionItem, ValueChange } from "@ledgerhq/types-live";
import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { useTrendViewModel } from "LLD/features/Portfolio/hooks/useTrendViewModel";
import { useSelector } from "LLD/hooks/redux";
import { formatPriceFragment, formatSignedFiatVariation } from "@ledgerhq/live-currency-format";
import type { FormattedValue } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import {
  clampDayChangePercentPointsNearZero,
  getFiatPriceVariationFromPercentChange,
  resolveMarketPriceSectionSourceId,
  resolveTrendPercentAndVariant,
} from "./utils";

type UseMarketPriceSectionViewModelProps = Readonly<{
  distributionItem?: DistributionItem;
  ledgerId?: string;
  marketData: AssetMarketData;
}>;

type UseMarketPriceSectionViewModelResult = Readonly<{
  shouldRenderSection: boolean;
  title: string;
  dayLabel: string;
  priceValue?: number;
  priceFormatter: (value: number) => FormattedValue;
  variationText: string;
  percentageText: string;
  variationVariant: "positive" | "negative" | "neutral";
  showSkeleton: boolean;
  hasPriceData: boolean;
  hasVariationData: boolean;
}>;

export function useMarketPriceSectionViewModel({
  distributionItem,
  ledgerId,
  marketData,
}: UseMarketPriceSectionViewModelProps): UseMarketPriceSectionViewModelResult {
  const { t } = useTranslation();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const fiatUnit = counterValueCurrency.units[0];
  const marketAssetId = resolveMarketPriceSectionSourceId({
    marketId: marketData.marketId,
    distributionItem,
    ledgerId,
  });
  const shouldRenderSection = Boolean(marketAssetId);
  const data = marketData.marketCurrencyData;

  const hasPriceData = Number.isFinite(data?.price);
  const showSkeleton = Boolean(marketAssetId && marketData.isLoading && !hasPriceData);
  const dayPercentage = data?.priceChangePercentage?.[KeysPriceChange.day];
  const normalizedDayPercentage = clampDayChangePercentPointsNearZero(dayPercentage);
  const dayVariationFiat = getFiatPriceVariationFromPercentChange(
    data?.price,
    normalizedDayPercentage,
  );

  const priceFormatter = useCallback(
    (value: number): FormattedValue => formatPriceFragment(fiatUnit, value, locale),
    [fiatUnit, locale],
  );

  const hasVariationData =
    hasPriceData && normalizedDayPercentage != null && dayVariationFiat != null;
  const variationText = hasVariationData
    ? formatSignedFiatVariation(dayVariationFiat, fiatUnit, locale)
    : "—";

  const valueChange: ValueChange = useMemo(
    () => ({
      percentage: hasVariationData ? normalizedDayPercentage / 100 : 0,
      value: 0,
    }),
    [hasVariationData, normalizedDayPercentage],
  );
  const { percentageText: trendPercentageText, variant: trendVariant } = useTrendViewModel({
    valueChange,
  });
  const { percentageText, variationVariant } = resolveTrendPercentAndVariant({
    hasVariationData,
    trendPercentageText,
    trendVariant,
  });

  return {
    shouldRenderSection,
    title: t("assetDetails.marketPrice"),
    dayLabel: t("assetDetails.day"),
    priceValue: hasPriceData ? data?.price : undefined,
    priceFormatter,
    variationText,
    percentageText,
    variationVariant,
    showSkeleton,
    hasPriceData,
    hasVariationData,
  };
}

export type MarketPriceSectionViewModelResult = Omit<
  UseMarketPriceSectionViewModelResult,
  "shouldRenderSection"
>;
