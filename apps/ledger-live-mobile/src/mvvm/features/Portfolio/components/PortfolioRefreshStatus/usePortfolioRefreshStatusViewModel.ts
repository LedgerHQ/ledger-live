import { useState, useEffect, useCallback, useRef } from "react";
import { getTimeAgo, MINUTE_MS } from "@ledgerhq/live-common/utils/timeAgo";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { selectIsRefreshing, selectLastRefreshTimestamp } from "~/reducers/portfolioRefresh";

export const UP_TO_DATE_VISIBLE_DURATION_MS = 3_000;

interface UsePortfolioRefreshStatusViewModelResult {
  isVisible: boolean;
  isRefreshing: boolean;
  lastRefreshLabel: string | null;
}

export const usePortfolioRefreshStatusViewModel = (): UsePortfolioRefreshStatusViewModelResult => {
  const { t } = useTranslation();
  const isRefreshing = useSelector(selectIsRefreshing);
  const lastRefreshTimestamp = useSelector(selectLastRefreshTimestamp);

  const computeLabel = useCallback(
    (timestamp: number | null): string | null => {
      if (timestamp === null) return null;

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
          return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(
            new Date(result.timestamp),
          );
        case "dateAcrossYears":
          return new Intl.DateTimeFormat(undefined, {
            day: "numeric",
            month: "short",
            year: "2-digit",
          }).format(new Date(result.timestamp));
      }
    },
    [t],
  );

  const [lastRefreshLabel, setLastRefreshLabel] = useState<string | null>(() =>
    computeLabel(lastRefreshTimestamp),
  );
  const [showUpToDate, setShowUpToDate] = useState(false);
  const prevIsRefreshing = useRef(isRefreshing);

  // Recompute label every minute
  useEffect(() => {
    setLastRefreshLabel(computeLabel(lastRefreshTimestamp));

    if (lastRefreshTimestamp === null) return;

    const interval = setInterval(() => {
      setLastRefreshLabel(computeLabel(lastRefreshTimestamp));
    }, MINUTE_MS);

    return () => clearInterval(interval);
  }, [lastRefreshTimestamp, computeLabel]);

  // When refresh completes, show "You're up to date" briefly then hide
  useEffect(() => {
    if (prevIsRefreshing.current && !isRefreshing) {
      setShowUpToDate(true);
      const timer = setTimeout(() => setShowUpToDate(false), UP_TO_DATE_VISIBLE_DURATION_MS);
      prevIsRefreshing.current = isRefreshing;
      return () => clearTimeout(timer);
    }
    prevIsRefreshing.current = isRefreshing;
  }, [isRefreshing]);

  return {
    isVisible: isRefreshing || showUpToDate,
    isRefreshing,
    lastRefreshLabel,
  };
};
