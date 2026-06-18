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
  dayAndHourFormat,
  dayFormat,
  hourFormat,
  useDateFormatter,
} from "~/renderer/hooks/useDateFormatter";
import { useAssetDetailChartSeries } from "../../hooks/useAssetDetailChartSeries";
import { isChartDerivedPriceChangeRange } from "@ledgerhq/live-common/market/utils/chartRangeVariation";
import {
  resolveMarketPriceSectionSourceId,
  resolveRangePriceChange,
  resolveTrendPercentAndVariant,
} from "./utils";
import { resolveAssetDetailSectionLoading } from "../../utils/resolveAssetDetailSectionLoading";
import { useScrubbedPrice } from "../../context/ScrubbedPriceContext";

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
  isScrubbing: boolean;
  scrubbedDateLabel?: string;
}>;

const RANGE_I18N_KEY: Record<LineChartRange, string> = {
  "1d": "assetDetails.day",
  "1w": "assetDetails.week",
  "1m": "assetDetails.month",
  "6m": "assetDetails.sixMonths",
  "1y": "assetDetails.year",
  "5y": "assetDetails.fiveYears",
  all: "assetDetails.allTime",
};

const HOVER_RANGE_WITH_TIME_AND_DATE = new Set<LineChartRange>(["1w", "1m", "6m"]);

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
  const isChartDerivedRange = isChartDerivedPriceChangeRange(selectedRange);

  const { prices: chartPrices } = useAssetDetailChartSeries({
    id: marketAssetId,
    counterCurrency: counterValueCurrency.ticker.toLowerCase(),
    selectedRange,
    ath: data?.ath,
    atl: data?.atl,
    athTime: data?.athDate?.getTime(),
    atlTime: data?.atlDate?.getTime(),
    skip: !marketAssetId || !isChartDerivedRange,
  });

  const hasPriceData = Number.isFinite(data?.price);
  const showSkeleton = Boolean(
    marketAssetId &&
      resolveAssetDetailSectionLoading(isDistributionLoading, marketData.isLoading, hasPriceData),
  );

  const { percentage: normalizedPercentage, variationFiat } = resolveRangePriceChange({
    selectedRange,
    chartPrices,
    price: data?.price,
    priceChangePercentage: data?.priceChangePercentage,
  });

  const priceFormatter = useCallback(
    (value: number): FormattedValue => formatPriceFragment(fiatUnit, value, locale),
    [fiatUnit, locale],
  );

  const { selection } = useScrubbedPrice();
  const isScrubbing = selection != null;

  const hasVariationData =
    normalizedPercentage != null && variationFiat != null && (isChartDerivedRange || hasPriceData);
  // While scrubbing, the trend reflects the change from the start of the range to the scrubbed point.
  const hasVariation = isScrubbing || hasVariationData;
  let variationText = "—";
  if (isScrubbing) {
    variationText = formatSignedFiatVariation(selection.variationFiat, fiatUnit, locale);
  } else if (hasVariationData && variationFiat != null) {
    variationText = formatSignedFiatVariation(variationFiat, fiatUnit, locale);
  }

  const valueChange: ValueChange = useMemo(() => {
    let percentage = 0;
    if (isScrubbing) {
      percentage = selection.percentage;
    } else if (hasVariationData && normalizedPercentage != null) {
      percentage = normalizedPercentage / 100;
    }
    return { percentage, value: 0 };
  }, [isScrubbing, selection, hasVariationData, normalizedPercentage]);
  const { percentageText: trendPercentageText, variant: trendVariant } = useTrendViewModel({
    valueChange,
    useDiscreetMasking: false,
  });
  const { percentageText, variationVariant } = resolveTrendPercentAndVariant({
    hasVariationData: hasVariation,
    trendPercentageText,
    trendVariant,
  });
  const formatHoverTime = useDateFormatter(hourFormat);
  const formatHoverDay = useDateFormatter(dayFormat);
  const formatHoverDateTime = useDateFormatter(dayAndHourFormat);
  const formatHoverDate = useCallback(
    (ms: number) => {
      const date = new Date(ms);
      if (selectedRange === "1d") return formatHoverTime(date);
      if (HOVER_RANGE_WITH_TIME_AND_DATE.has(selectedRange)) return formatHoverDateTime(date);
      return formatHoverDay(date);
    },
    [formatHoverDay, formatHoverDateTime, formatHoverTime, selectedRange],
  );

  let priceValue: number | undefined;
  if (isScrubbing) {
    priceValue = selection.price;
  } else if (hasPriceData) {
    priceValue = data?.price;
  }

  return {
    shouldRenderSection,
    title: t("assetDetails.marketPrice"),
    rangeLabel: t(RANGE_I18N_KEY[selectedRange]),
    priceValue,
    priceFormatter,
    variationText,
    percentageText,
    variationVariant,
    showSkeleton,
    hasPriceData,
    hasVariationData,
    isScrubbing,
    scrubbedDateLabel: isScrubbing ? formatHoverDate(selection.timestamp) : undefined,
  };
}

export type MarketPriceSectionViewModelResult = Omit<
  UseMarketPriceSectionViewModelResult,
  "shouldRenderSection"
>;
