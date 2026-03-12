import { useState, useEffect, useRef } from "react";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { selectIsRefreshing } from "~/reducers/portfolioRefresh";

export const UP_TO_DATE_VISIBLE_DURATION_MS = 3_000;

interface UsePortfolioRefreshStatusViewModelResult {
  isVisible: boolean;
  isRefreshing: boolean;
  refreshingLabel: string;
  upToDateLabel: string;
}

export const usePortfolioRefreshStatusViewModel = (): UsePortfolioRefreshStatusViewModelResult => {
  const { t } = useTranslation();
  const isRefreshing = useSelector(selectIsRefreshing);

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

  return {
    isVisible: isRefreshing || showUpToDate,
    isRefreshing,
    refreshingLabel: t("portfolio.refreshStatus.refreshing"),
    upToDateLabel: t("portfolio.refreshStatus.upToDate"),
  };
};
