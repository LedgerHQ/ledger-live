import { useCallback, useMemo } from "react";
import type { AssetMarketData } from "@ledgerhq/asset-detail";
import type { DistributionItem, ValueChange } from "@ledgerhq/types-live";
import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { formatCurrencyUnitFragment, valueFromUnit } from "@ledgerhq/live-common/currencies/index";
import { useTrendViewModel } from "LLD/features/Portfolio/hooks/useTrendViewModel";
import { useSelector } from "LLD/hooks/redux";
import type { FormattedValue } from "@ledgerhq/lumen-ui-react";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import {
  clampDayChangePercentPointsNearZero,
  fiatAmountToIntegerSmallestUnit,
  formatSignedFiatVariation,
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
  const dayVariationSmallestUnit =
    dayVariationFiat == null
      ? undefined
      : fiatAmountToIntegerSmallestUnit(dayVariationFiat, fiatUnit);

  const priceFormatter = useCallback(
    (value: number): FormattedValue =>
      formatCurrencyUnitFragment(fiatUnit, valueFromUnit(new BigNumber(value), fiatUnit), {
        locale,
        showCode: true,
        disableRounding: true,
        showAllDigits: true,
        useGrouping: true,
      }),
    [fiatUnit, locale],
  );

  const hasVariationData =
    hasPriceData && normalizedDayPercentage != null && dayVariationSmallestUnit != null;
  const variationText = hasVariationData
    ? formatSignedFiatVariation(dayVariationSmallestUnit, fiatUnit, locale)
    : "—";

  const valueChange: ValueChange = useMemo(() => {
    if (!hasPriceData || normalizedDayPercentage == null || dayVariationSmallestUnit == null) {
      return { percentage: 0, value: 0 };
    }
    return {
      percentage: normalizedDayPercentage / 100,
      value: dayVariationSmallestUnit,
    };
  }, [hasPriceData, normalizedDayPercentage, dayVariationSmallestUnit]);
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
