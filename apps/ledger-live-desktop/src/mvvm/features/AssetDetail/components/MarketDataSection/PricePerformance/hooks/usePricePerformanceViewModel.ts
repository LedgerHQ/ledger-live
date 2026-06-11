import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";
import { longDayFormat, useDateFormatter, fromNow } from "~/renderer/hooks/useDateFormatter";
import type { MarketDataSectionCurrencyData } from "../../hooks/useMarketDataSectionCurrencyData";

const MISSING = "-";

export type PricePerformanceBlock = Readonly<{
  title: string;
  priceText: string;
  dateLine: string;
  changeText: string;
}>;

function formatPctVsReference(
  locale: string,
  current?: number,
  reference?: number,
): string | undefined {
  if (current == null || reference == null || reference === 0) return undefined;
  const pct = ((current - reference) / reference) * 100;
  if (Number.isNaN(pct)) return undefined;
  const formatted = new Intl.NumberFormat(locale, {
    signDisplay: "exceptZero",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pct);
  return `${formatted}%`;
}

export function usePricePerformanceViewModel(currencyData: MarketDataSectionCurrencyData) {
  const { t } = useTranslation();
  const { data, showSkeleton, counterCurrency, locale } = currencyData;
  const formatLongDate = useDateFormatter(longDayFormat);

  const sectionTitle = t("assetDetails.pricePerformance");

  const fiat = useMemo(
    () => (value?: number) =>
      counterValueFormatter({ value, currency: counterCurrency.toUpperCase(), locale }),
    [counterCurrency, locale],
  );

  const athBlock: PricePerformanceBlock = useMemo(() => {
    const d = data?.athDate;
    const dateLine =
      d && !Number.isNaN(d.getTime()) ? `${formatLongDate(d)} (${fromNow(d)})` : MISSING;
    return {
      title: t("market.detailsPage.allTimeHigh"),
      priceText: fiat(data?.ath),
      dateLine,
      changeText: formatPctVsReference(locale, data?.price, data?.ath) ?? MISSING,
    };
  }, [data?.ath, data?.athDate, data?.price, fiat, formatLongDate, locale, t]);

  const atlBlock: PricePerformanceBlock = useMemo(() => {
    const d = data?.atlDate;
    const dateLine =
      d && !Number.isNaN(d.getTime()) ? `${formatLongDate(d)} (${fromNow(d)})` : MISSING;
    return {
      title: t("market.detailsPage.allTimeLow"),
      priceText: fiat(data?.atl),
      dateLine,
      changeText: formatPctVsReference(locale, data?.price, data?.atl) ?? MISSING,
    };
  }, [data?.atl, data?.atlDate, data?.price, fiat, formatLongDate, locale, t]);

  return {
    athBlock,
    atlBlock,
    showSkeleton,
    sectionTitle,
    sectionDisclaimer: t("assetDetails.marketStatsDisclaimer"),
  };
}

export type PricePerformanceViewModelResult = ReturnType<typeof usePricePerformanceViewModel>;
