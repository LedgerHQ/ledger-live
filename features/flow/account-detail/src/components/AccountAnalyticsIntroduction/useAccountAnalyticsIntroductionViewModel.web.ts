import { useCallback } from "react";
import { useTranslation } from "@shared/i18n";
import { shouldShowAccountAnalyticsIntroduction } from "../../logic/shouldShowAccountAnalyticsIntroduction";
import type { AccountAnalyticsIntroductionProps } from "./AccountAnalyticsIntroduction.types";
import type { AccountAnalyticsIntroductionViewModel } from "./types";

export function useAccountAnalyticsIntroductionViewModel({
  hasConfirmedHistory,
  hasDismissed,
  onDismiss,
  onOpenAnalytics,
  testID,
}: AccountAnalyticsIntroductionProps): AccountAnalyticsIntroductionViewModel {
  const { t } = useTranslation();
  const openAnalytics = useCallback(() => {
    onDismiss();
    onOpenAnalytics();
  }, [onDismiss, onOpenAnalytics]);

  return {
    isVisible: shouldShowAccountAnalyticsIntroduction({ hasConfirmedHistory, hasDismissed }),
    title: t("accountDetail.analyticsIntroduction.title"),
    description: t("accountDetail.analyticsIntroduction.description"),
    actionLabel: t("accountDetail.analyticsIntroduction.cta"),
    dismissLabel: t("accountDetail.analyticsIntroduction.dismiss"),
    onDismiss,
    onOpenAnalytics: openAnalytics,
    testID,
  };
}
