import { useState, useEffect, useRef } from "react";
import { getTimeAgo } from "@ledgerhq/live-common/utils/timeAgo";
import { useSelector } from "~/context/hooks";
import { useTranslation, useLocale } from "~/context/Locale";
import { selectIsRefreshing, selectLastRefreshTimestamp } from "~/reducers/portfolioRefresh";

export const UP_TO_DATE_VISIBLE_DURATION_MS = 3_000;

interface UsePortfolioRefreshStatusViewModelResult {
  isVisible: boolean;
  isRefreshing: boolean;
  refreshingLabel: string;
  upToDateLabel: string;
}

export const usePortfolioRefreshStatusViewModel = (): UsePortfolioRefreshStatusViewModelResult => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const isRefreshing = useSelector(selectIsRefreshing);
  const lastRefreshTimestamp = useSelector(selectLastRefreshTimestamp);

  const [showUpToDate, setShowUpToDate] = useState(false);
  const prevIsRefreshing = useRef(isRefreshing);

  useEffect(() => {
    if (prevIsRefreshing.current && !isRefreshing) {
      setShowUpToDate(true);
      const timer = setTimeout(() => setShowUpToDate(false), UP_TO_DATE_VISIBLE_DURATION_MS);
      prevIsRefreshing.current = isRefreshing;
      return () => clearTimeout(timer);
    }
    prevIsRefreshing.current = isRefreshing;
  }, [isRefreshing]);

  const computeTimeAgoLabel = (timestamp: number): string => {
    const result = getTimeAgo(timestamp);

    switch (result.key) {
      case "justNow":
        return t("portfolio.refreshStatus.timeAgo.justNow");
      case "minutesAgo":
        return t("portfolio.refreshStatus.timeAgo.minutesAgo", { count: result.count });
      case "hoursAgo":
        return t("portfolio.refreshStatus.timeAgo.hoursAgo", { count: result.count });
      case "daysAgo":
        return t("portfolio.refreshStatus.timeAgo.daysAgo", { count: result.count });
      case "dateInYear":
        return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(
          new Date(result.timestamp),
        );
      case "dateAcrossYears":
        return new Intl.DateTimeFormat(locale, {
          day: "numeric",
          month: "short",
          year: "2-digit",
        }).format(new Date(result.timestamp));
      default:
        return "";
    }
  };

  const refreshingLabel =
    lastRefreshTimestamp === null
      ? t("portfolio.refreshStatus.refreshingInitial")
      : t("portfolio.refreshStatus.refreshing", {
          timeAgo: computeTimeAgoLabel(lastRefreshTimestamp),
        });

  return {
    isVisible: isRefreshing || showUpToDate,
    isRefreshing,
    refreshingLabel,
    upToDateLabel: t("portfolio.refreshStatus.upToDate"),
  };
};
