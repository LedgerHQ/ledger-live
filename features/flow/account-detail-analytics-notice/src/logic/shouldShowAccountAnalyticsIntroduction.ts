import type { AccountAnalyticsIntroductionStatus } from "../types";

export function shouldShowAccountAnalyticsIntroduction({
  isEnabled,
  hasConfirmedHistory,
  hasDismissed,
}: AccountAnalyticsIntroductionStatus): boolean {
  return isEnabled && hasConfirmedHistory && !hasDismissed;
}
