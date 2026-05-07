import { useCallback, useMemo } from "react";
import type { DistributionItem, ValueChange } from "@ledgerhq/types-live";
import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { useGetCurrencyDataQuery } from "@ledgerhq/live-common/market/state-manager/api";
import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH } from "@ledgerhq/live-common/market/utils/timers";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import { useTrendViewModel } from "LLD/features/Portfolio/hooks/useTrendViewModel";
import { useSelector } from "LLD/hooks/redux";
import type { FormattedValue } from "@ledgerhq/lumen-ui-react";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import {
  clampDayChangePercentPointsNearZero,
  formatSignedFiatVariation,
  getFiatPriceVariationFromPercentChange,
  hasValidMarketSpotPrice,
  resolveMarketPriceCurrencyDataId,
  resolveTrendPercentAndVariant,
} from "./utils";

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

export function useMarketPriceSectionViewModel({
  distributionItem,
  marketAssetId,
}: UseMarketPriceSectionViewModelProps): UseMarketPriceSectionViewModelResult {
  const { t } = useTranslation();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const counterCurrency = counterValueCurrency.ticker.toLowerCase();
  const fiatUnit = counterValueCurrency.units[0];
  const currencyDataId = resolveMarketPriceCurrencyDataId(marketAssetId, distributionItem);

  const { data, isLoading, isFetching } = useGetCurrencyDataQuery(
    { id: currencyDataId ?? "", counterCurrency },
    {
      skip: !currencyDataId,
      pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    },
  );

  const hasPriceData = hasValidMarketSpotPrice(data);
  const showSkeleton = Boolean(currencyDataId && (isLoading || isFetching) && !hasPriceData);
  const dayPercentage = data?.priceChangePercentage?.[KeysPriceChange.day];
  const normalizedDayPercentage = clampDayChangePercentPointsNearZero(dayPercentage);
  const dayVariationFiat = getFiatPriceVariationFromPercentChange(
    data?.price,
    normalizedDayPercentage,
  );

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

  const valueChange: ValueChange = useMemo(() => {
    if (!hasPriceData || normalizedDayPercentage == null || dayVariationFiat == null) {
      return { percentage: 0, value: 0 };
    }
    return {
      percentage: normalizedDayPercentage / 100,
      value: dayVariationFiat,
    };
  }, [hasPriceData, normalizedDayPercentage, dayVariationFiat]);
  const { percentageText: trendPercentageText, variant: trendVariant } = useTrendViewModel({
    valueChange,
  });
  const { percentageText, variationVariant } = resolveTrendPercentAndVariant({
    hasVariationData,
    trendPercentageText,
    trendVariant,
  });

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
