import { useCallback, useMemo } from "react";
import type { DistributionItem, ValueChange } from "@ledgerhq/types-live";
import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { useGetCurrencyDataQuery } from "@ledgerhq/live-common/market/state-manager/api";
import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH } from "@ledgerhq/live-common/market/utils/timers";
import { dadaIdToMarketId } from "@ledgerhq/live-common/market/utils/index";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import { useTrendViewModel } from "LLD/features/Portfolio/hooks/useTrendViewModel";
import { useSelector } from "LLD/hooks/redux";
import type { FormattedValue } from "@ledgerhq/lumen-ui-react";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";

type UseMarketPriceSectionViewModelProps = Readonly<{
  distributionItem: DistributionItem | undefined;
  marketAssetId: string | undefined;
}>;

type UseMarketPriceSectionViewModelResult = Readonly<{
  title: string;
  dayLabel: string;
  priceValue?: number;
  priceFormatter: (value: number) => FormattedValue;
  variationValue: number;
  variationText: string;
  percentageText: string;
  variationVariant: "positive" | "negative" | "neutral";
  showSkeleton: boolean;
  hasPriceData: boolean;
  hasVariationData: boolean;
}>;

function getFiatPriceVariation(price?: number, dayPercentage?: number) {
  if (price == null || dayPercentage == null) return undefined;
  const denominator = 1 + dayPercentage / 100;
  if (denominator === 0) return undefined;
  const previousPrice = price / denominator;
  const variation = price - previousPrice;
  if (Number.isNaN(variation)) return undefined;
  return variation;
}

function formatSignedFiatVariation(value: number, counterCurrency: string, locale: string): string {
  let sign = "";
  if (value > 0) sign = "+";
  else if (value < 0) sign = "-";
  return `${sign}${counterValueFormatter({
    value: Math.abs(value),
    currency: counterCurrency.toUpperCase(),
    locale,
  })}`;
}

function resolveCurrencyDataId(
  marketId: string | undefined,
  marketAssetId: string | undefined,
  distributionCurrencyId: string | undefined,
): string | undefined {
  return marketId ?? marketAssetId ?? distributionCurrencyId;
}

export function useMarketPriceSectionViewModel({
  distributionItem,
  marketAssetId,
}: UseMarketPriceSectionViewModelProps): UseMarketPriceSectionViewModelResult {
  const { t } = useTranslation();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const counterCurrency = counterValueCurrency.ticker.toLowerCase();
  const fiatUnit = counterValueCurrency.units[0];
  const marketId = distributionItem?.marketId
    ? dadaIdToMarketId(distributionItem.marketId)
    : undefined;
  const currencyDataId = resolveCurrencyDataId(
    marketId,
    marketAssetId,
    distributionItem?.currency.id,
  );

  const { data, isLoading, isFetching } = useGetCurrencyDataQuery(
    { id: currencyDataId ?? "", counterCurrency },
    {
      skip: !currencyDataId,
      pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    },
  );

  const showSkeleton = Boolean(currencyDataId && (isLoading || isFetching) && !data);
  const hasPriceData = data?.price != null && !Number.isNaN(data.price);
  const dayPercentage = data?.priceChangePercentage?.[KeysPriceChange.day];
  const normalizedDayPercentage =
    dayPercentage != null && Math.abs(dayPercentage) < 0.005 ? 0 : dayPercentage;
  const dayVariationFiat = getFiatPriceVariation(data?.price, normalizedDayPercentage);

  const priceFormatter = useCallback(
    (value: number): FormattedValue =>
      formatCurrencyUnitFragment(fiatUnit, new BigNumber(value), {
        locale,
        showCode: true,
      }),
    [fiatUnit, locale],
  );

  const variationValue = dayVariationFiat ?? 0;
  const hasVariationData =
    hasPriceData && normalizedDayPercentage != null && dayVariationFiat != null;
  const variationText = hasVariationData
    ? formatSignedFiatVariation(variationValue, counterCurrency, locale)
    : "—";

  const valueChange: ValueChange = useMemo(
    () => ({
      percentage: normalizedDayPercentage == null ? 0 : normalizedDayPercentage / 100,
      value: variationValue,
    }),
    [normalizedDayPercentage, variationValue],
  );
  const { percentageText: trendPercentageText, variant: trendVariant } = useTrendViewModel({
    valueChange,
  });
  const percentageText = hasVariationData ? trendPercentageText : "—";
  const variationVariant = hasVariationData ? trendVariant : "neutral";

  return {
    title: t("assetDetails.marketPrice"),
    dayLabel: t("assetDetails.day"),
    priceValue: hasPriceData ? data?.price : undefined,
    priceFormatter,
    variationValue,
    variationText,
    percentageText,
    variationVariant,
    showSkeleton,
    hasPriceData,
    hasVariationData,
  };
}

export type MarketPriceSectionViewModelResult = ReturnType<typeof useMarketPriceSectionViewModel>;
