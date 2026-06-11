import { useMemo } from "react";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { useTranslation, useLocale } from "~/context/Locale";
import { counterValueFormatter } from "LLM/features/Market/utils";
import { useAssetMarketData } from "../../hooks/useAssetMarketData";

type PriceRecord = {
  id: string;
  label: string;
  value: string;
  date: string;
  relativeTime: string;
  changePercentage: string;
};

type TFunc = (key: string, options?: Record<string, unknown>) => string;

export function getRelativeTime(date: Date, now: Date, t: TFunc): string {
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) return t("assetDetail.pricePerformance.yearsAgo", { count: diffYears });
  if (diffMonths > 0) return t("assetDetail.pricePerformance.monthsAgo", { count: diffMonths });
  if (diffDays > 0) return t("assetDetail.pricePerformance.daysAgo", { count: diffDays });
  if (diffHours > 0) return t("assetDetail.pricePerformance.hoursAgo", { count: diffHours });
  if (diffMinutes > 0) return t("assetDetail.pricePerformance.minutesAgo", { count: diffMinutes });
  return t("assetDetail.pricePerformance.justNow");
}

function computeChangePercentage(currentPrice: number, referencePrice: number): number {
  if (referencePrice === 0) return 0;
  return ((currentPrice - referencePrice) / referencePrice) * 100;
}

function formatPercentage(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

type Params = {
  currency: AssetDetailCurrencyProps;
  marketApiId?: string;
  knownLedgerIds?: readonly string[];
  knownMarketId?: string;
};

export function usePricePerformanceViewModel({
  currency,
  marketApiId,
  knownLedgerIds,
  knownMarketId,
}: Params) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { marketCurrency, counterCurrency, isLoading, isError } = useAssetMarketData({
    marketApiId,
    knownLedgerIds,
    knownMarketId,
  });

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
    [locale],
  );

  const records: PriceRecord[] = useMemo(() => {
    if (!marketCurrency) return [];

    const now = new Date();
    const { ath, athDate, atl, atlDate, price } = marketCurrency;
    const result: PriceRecord[] = [];

    if (ath != null && athDate) {
      const athDateObj = athDate instanceof Date ? athDate : new Date(athDate);
      const athChange = computeChangePercentage(price, ath);
      result.push({
        id: "ath",
        label: t("assetDetail.pricePerformance.allTimeHigh"),
        value: counterValueFormatter({
          currency: counterCurrency,
          value: ath,
          locale,
          t,
        }),
        date: dateFormatter.format(athDateObj),
        relativeTime: getRelativeTime(athDateObj, now, t),
        changePercentage: formatPercentage(athChange),
      });
    }

    if (atl != null && atlDate) {
      const atlDateObj = atlDate instanceof Date ? atlDate : new Date(atlDate);
      const atlChange = computeChangePercentage(price, atl);
      result.push({
        id: "atl",
        label: t("assetDetail.pricePerformance.allTimeLow"),
        value: counterValueFormatter({
          currency: counterCurrency,
          value: atl,
          locale,
          t,
        }),
        date: dateFormatter.format(atlDateObj),
        relativeTime: getRelativeTime(atlDateObj, now, t),
        changePercentage: formatPercentage(atlChange),
      });
    }

    return result;
  }, [marketCurrency, counterCurrency, locale, t, dateFormatter]);

  return {
    records,
    isLoading,
    isError,
    hasData: !!marketCurrency && records.length > 0,
  };
}

export type PricePerformanceViewModelResult = ReturnType<typeof usePricePerformanceViewModel>;
