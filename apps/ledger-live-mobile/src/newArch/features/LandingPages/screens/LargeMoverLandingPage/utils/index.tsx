import { TFunction } from "react-i18next";
import { counterValueFormatter } from "LLM/features/Market/utils";
import i18next from "i18next";

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

  if (years > 0) return generatePath(years > 1 ? "years_plural" : "years", years);
  if (months > 0) return generatePath(months > 1 ? "months_plural" : "months", months);
  if (days > 0) return generatePath(days > 1 ? "days_plural" : "days", days);
  if (hours > 0) return generatePath(hours > 1 ? "hours_plural" : "hours", hours);
  if (minutes > 0) return generatePath(minutes > 1 ? "minutes_plural" : "minutes", minutes);

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

export { formatCounterValue, getTimeAgoCode };
