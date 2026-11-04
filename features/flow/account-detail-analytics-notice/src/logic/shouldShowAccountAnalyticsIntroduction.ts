import type { AccountAnalyticsIntroductionStatus } from "../types";

export function shouldShowAccountAnalyticsIntroduction({
  hasConfirmedHistory,
  hasDismissed,
}: AccountAnalyticsIntroductionStatus): boolean {
  return hasConfirmedHistory && !hasDismissed;
}
