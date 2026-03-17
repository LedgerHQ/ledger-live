import { useCallback, useEffect, useReducer } from "react";
import { useLocation } from "react-router";
import { track } from "~/renderer/analytics/segment";

import { usePortfolioBalance } from "LLD/hooks/usePortfolioBalance";
import { useActivityIndicatorTooltip } from "./useActivityIndicatorTooltip";
import { getActivityIndicatorIcon } from "../utils/getActivityIndicatorIcon";
import { TOOLTIP_UPDATE_INTERVAL_MS } from "../utils/constants";

export const useActivityIndicator = () => {
  const location = useLocation();
  const [, forceTooltipUpdate] = useReducer((tick: number) => tick + 1, 0);

  const { hasAccounts, syncPhase, allAccounts, listOfErrorAccountNames, handleSync } =
    usePortfolioBalance();

  const isRotating = syncPhase === "syncing";
  const isError = syncPhase === "failed";

  const lastSyncMs = Math.max(...allAccounts.map(a => a.lastSyncDate?.getTime() ?? 0), 0);

  const needsTooltipUpdates = hasAccounts && lastSyncMs > 0;
  useEffect(() => {
    if (!needsTooltipUpdates) return;
    const id = setInterval(forceTooltipUpdate, TOOLTIP_UPDATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [needsTooltipUpdates]);

  const icon = getActivityIndicatorIcon(isError, isRotating);
  const tooltip = useActivityIndicatorTooltip({
    isRotating,
    isError,
    listOfErrorAccountNames,
    lastSyncMs,
  });

  const onTooltipShow = useCallback(() => {
    if (isError) {
      track("SyncErrorList", {
        page: location.pathname,
        currencies: listOfErrorAccountNames
          ? listOfErrorAccountNames.split("/").filter(Boolean)
          : [],
      });
    }
  }, [isError, listOfErrorAccountNames, location.pathname]);

  return {
    hasAccounts,
    handleSync,
    isError,
    isRotating,
    tooltip,
    icon,
    onTooltipShow: isError ? onTooltipShow : undefined,
  };
};
