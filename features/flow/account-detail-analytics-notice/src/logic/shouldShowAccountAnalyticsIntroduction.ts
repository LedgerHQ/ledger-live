import type { AccountAnalyticsIntroductionStatus } from "../types";

export function shouldShowAccountAnalyticsIntroduction({
  isEnabled,
  isEligible,
  hasConfirmedHistory,
  hasDismissed,
}: AccountAnalyticsIntroductionStatus): boolean {
  return isEnabled && isEligible && hasConfirmedHistory && !hasDismissed;
}
