import { useTranslation } from "@shared/i18n";
import { shouldShowAccountAnalyticsIntroduction } from "./logic/shouldShowAccountAnalyticsIntroduction";
import type { AccountAnalyticsIntroductionProps } from "./AccountAnalyticsIntroduction.types";
import type { AccountAnalyticsIntroductionViewModel } from "./AccountAnalyticsIntroductionViewModel.types";

export function useAccountAnalyticsIntroductionViewModel({
  isEnabled,
  isEligible,
  hasConfirmedHistory,
  hasDismissed,
  onDismiss,
  onOpenAnalytics,
  testID,
}: AccountAnalyticsIntroductionProps): AccountAnalyticsIntroductionViewModel {
  const { t } = useTranslation();

  return {
    isVisible: shouldShowAccountAnalyticsIntroduction({
      isEnabled,
      isEligible,
      hasConfirmedHistory,
      hasDismissed,
    }),
    title: t("accountDetail.analyticsIntroduction.title"),
    description: t("accountDetail.analyticsIntroduction.description"),
    actionLabel: t("accountDetail.analyticsIntroduction.cta"),
    dismissLabel: t("accountDetail.analyticsIntroduction.dismiss"),
    onDismiss,
    onOpenAnalytics,
    testID,
  };
}
