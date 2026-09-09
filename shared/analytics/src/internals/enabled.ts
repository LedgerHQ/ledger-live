import { getAnalyticsState, getIsTrackingEnabledSelector } from "../registry";

export function isEnabled(): boolean {
  const isTrackingEnabledSelector = getIsTrackingEnabledSelector();
  const analyticsState = getAnalyticsState();

  if (!analyticsState || !isTrackingEnabledSelector) {
    return false;
  }

  return isTrackingEnabledSelector(analyticsState);
}
