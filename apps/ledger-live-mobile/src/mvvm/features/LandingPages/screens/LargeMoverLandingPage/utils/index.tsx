import type { TFunction } from "i18next";
import { counterValueFormatter } from "LLM/features/Market/utils";
import i18next from "i18next";
import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { findCryptoCurrencyByTicker } from "@ledgerhq/live-common/currencies/index";

function getTimeAgoCode(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();

  const seconds = Math.floor(diffInMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  const generatePath = (key: string, value: number) =>
    i18next.t(`largeMover.timeAgo.${key}`, { count: value });

  if (years > 0) return generatePath("years", years);
  if (months > 0) return generatePath("months", months);
  if (days > 0) return generatePath("days", days);
  if (hours > 0) return generatePath("hours", hours);
  if (minutes > 0) return generatePath("minutes", minutes);

  return generatePath("seconds", seconds);
}

const formatCounterValue = (
  value: number,
  currency: string,
  locale: string,
  t: TFunction<"translation", undefined>,
  extra?: { ticker?: string },
) =>
  counterValueFormatter({
    value,
    shorten: true,
    currency,
    locale,
    t,
    ...extra,
  })
    .replace(/ /g, "")
    .replace(/n/g, "");

const getColors = (priceChangePercentage: number) => {
  if (priceChangePercentage === 0) return { textColor: "neutral.c100", bgColor: "neutral.c20" };

  return priceChangePercentage > 0
    ? { textColor: "success.c70", bgColor: "success.c10" }
    : { textColor: "error.c50", bgColor: "error.c10" };
};

const rangeMap: Record<string, KeysPriceChange> = {
  hour: KeysPriceChange.hour,
  day: KeysPriceChange.day,
  week: KeysPriceChange.week,
  month: KeysPriceChange.month,
  year: KeysPriceChange.year,
};

function getCurrencyIdsFromTickers(tickers: string[]): string[] {
  return tickers.flatMap(ticker => {
    const currency = findCryptoCurrencyByTicker(ticker);
    return currency?.id ? [currency.id] : [];
  });
}

export { formatCounterValue, getTimeAgoCode, getColors, rangeMap, getCurrencyIdsFromTickers };
