import { useState, useEffect, useRef } from "react";
import { formatTimeAgo, MINUTE_MS } from "@ledgerhq/live-common/utils/timeAgo";
import { useSelector } from "~/context/hooks";
import { useTranslation, useLocale } from "~/context/Locale";
import { selectIsRefreshing, selectLastSyncTimestampSnapshot } from "~/reducers/portfolioRefresh";

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
  const lastSyncTimestampSnapshot = useSelector(selectLastSyncTimestampSnapshot);

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

  const isStale =
    lastSyncTimestampSnapshot !== null && Date.now() - lastSyncTimestampSnapshot >= MINUTE_MS;

  const timeAgo =
    isStale && lastSyncTimestampSnapshot !== null
      ? formatTimeAgo(lastSyncTimestampSnapshot, locale)
      : null;

  const refreshingLabel =
    timeAgo === null
      ? t("portfolio.refreshStatus.refreshingInitial")
      : t("portfolio.refreshStatus.refreshing", { timeAgo });

  return {
    isVisible: isRefreshing || showUpToDate,
    isRefreshing,
    refreshingLabel,
    upToDateLabel: t("portfolio.refreshStatus.upToDate"),
  };
};
