import { useTranslation } from "react-i18next";

import { getLastSyncTooltipDescriptor } from "../utils/getLastSyncTooltipMessage";

export interface ActivityIndicatorTooltipParams {
  isRotating: boolean;
  isError: boolean;
  listOfErrorAccountNames: string;
  lastSyncMs: number;
}

/**
 * Returns the translated tooltip string for the activity indicator
 */
export function useActivityIndicatorTooltip({
  isRotating,
  isError,
  listOfErrorAccountNames,
  lastSyncMs,
}: ActivityIndicatorTooltipParams): string | null {
  const { t } = useTranslation();

  if (isRotating) {
    return null;
  }

  if (isError) {
    if (listOfErrorAccountNames.length === 0) {
      return t("topBar.activityIndicator.emptyErrorToolTip");
    }
    return t("topBar.activityIndicator.errorToolTip", {
      accounts: listOfErrorAccountNames,
    });
  }

  if (lastSyncMs <= 0 || !Number.isFinite(lastSyncMs)) {
    return t("topBar.activityIndicator.upToDate");
  }

  const elapsedMs = Date.now() - lastSyncMs;
  const descriptor = getLastSyncTooltipDescriptor(elapsedMs);
  return "count" in descriptor ? t(descriptor.key, { count: descriptor.count }) : t(descriptor.key);
}
