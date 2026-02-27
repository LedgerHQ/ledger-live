import { useState, useEffect, useRef } from "react";
import { formatTimeAgo } from "@ledgerhq/live-common/utils/timeAgo";
import { useSelector } from "~/context/hooks";
import { useTranslation, useLocale } from "~/context/Locale";
import { selectIsRefreshing, selectLastSyncTimestamp } from "~/reducers/portfolioRefresh";

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
  const lastRefreshTimestamp = useSelector(selectLastSyncTimestamp);

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

  const refreshingLabel =
    lastRefreshTimestamp === null
      ? t("portfolio.refreshStatus.refreshingInitial")
      : t("portfolio.refreshStatus.refreshing", {
          timeAgo: formatTimeAgo(lastRefreshTimestamp, locale),
        });

  return {
    isVisible: isRefreshing || showUpToDate,
    isRefreshing,
    refreshingLabel,
    upToDateLabel: t("portfolio.refreshStatus.upToDate"),
  };
};
