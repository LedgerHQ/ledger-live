import { useCallback, useMemo } from "react";
import type { AssetMarketData } from "@ledgerhq/asset-detail";
import type { DistributionItem, ValueChange } from "@ledgerhq/types-live";
import { useTrendViewModel } from "LLD/features/Portfolio/hooks/useTrendViewModel";
import { useSelector } from "LLD/hooks/redux";
import { formatPriceFragment, formatSignedFiatVariation } from "@ledgerhq/live-currency-format";
import type { FormattedValue } from "@ledgerhq/lumen-ui-react";
import type { LineChartRange } from "LLD/components/LineChart";
import { useTranslation } from "react-i18next";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import {
  clampDayChangePercentPointsNearZero,
  getFiatPriceVariationFromPercentChange,
  getPriceChangeKeyForRange,
  resolveMarketPriceSectionSourceId,
  resolveTrendPercentAndVariant,
} from "./utils";
import { resolveAssetDetailSectionLoading } from "../../utils/resolveAssetDetailSectionLoading";

type UseMarketPriceSectionViewModelProps = Readonly<{
  distributionItem?: DistributionItem;
  ledgerId?: string;
  marketData: AssetMarketData;
  isDistributionLoading: boolean;
  selectedRange: LineChartRange;
}>;

type UseMarketPriceSectionViewModelResult = Readonly<{
  shouldRenderSection: boolean;
  title: string;
  rangeLabel: string;
  priceValue?: number;
  priceFormatter: (value: number) => FormattedValue;
  variationText: string;
  percentageText: string;
  variationVariant: "positive" | "negative" | "neutral";
  showSkeleton: boolean;
  hasPriceData: boolean;
  hasVariationData: boolean;
}>;

const RANGE_I18N_KEY: Record<LineChartRange, string> = {
  "1d": "assetDetails.day",
  "1w": "assetDetails.week",
  "1m": "assetDetails.month",
  "1y": "assetDetails.year",
  all: "assetDetails.allTime",
};

export function useMarketPriceSectionViewModel({
  distributionItem,
  ledgerId,
  marketData,
  isDistributionLoading,
  selectedRange,
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
  const showSkeleton = Boolean(
    marketAssetId &&
      resolveAssetDetailSectionLoading(isDistributionLoading, marketData.isLoading, hasPriceData),
  );
  const priceChangeKey = getPriceChangeKeyForRange(selectedRange);
  const rangePercentage = data?.priceChangePercentage?.[priceChangeKey];
  const normalizedPercentage = clampDayChangePercentPointsNearZero(rangePercentage);
  const variationFiat = getFiatPriceVariationFromPercentChange(data?.price, normalizedPercentage);

  const priceFormatter = useCallback(
    (value: number): FormattedValue => formatPriceFragment(fiatUnit, value, locale),
    [fiatUnit, locale],
  );

  const hasVariationData = hasPriceData && normalizedPercentage != null && variationFiat != null;
  const variationText = hasVariationData
    ? formatSignedFiatVariation(variationFiat, fiatUnit, locale)
    : "—";

  const valueChange: ValueChange = useMemo(
    () => ({
      percentage: hasVariationData ? normalizedPercentage / 100 : 0,
      value: 0,
    }),
    [hasVariationData, normalizedPercentage],
  );
  const { percentageText: trendPercentageText, variant: trendVariant } = useTrendViewModel({
    valueChange,
    useDiscreetMasking: false,
  });
  const { percentageText, variationVariant } = resolveTrendPercentAndVariant({
    hasVariationData,
    trendPercentageText,
    trendVariant,
  });

  return {
    shouldRenderSection,
    title: t("assetDetails.marketPrice"),
    rangeLabel: t(RANGE_I18N_KEY[selectedRange]),
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
