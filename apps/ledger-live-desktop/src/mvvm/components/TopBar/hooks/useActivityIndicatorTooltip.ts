import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
import { formatTimeAgo } from "@ledgerhq/live-common/utils/timeAgo";

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
  const locale = useSelector(localeSelector);

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

  const timeAgo = formatTimeAgo(lastSyncMs, locale);
  if (timeAgo === null) {
    return t("topBar.activityIndicator.upToDate");
  }
  return t("topBar.activityIndicator.lastSync", { timeAgo });
}
