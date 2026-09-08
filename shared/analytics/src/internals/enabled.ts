import { getAnalyticsState, getIsTrackingEnabledSelector } from "../registry";

export function isTrackingEnabled(): boolean {
  const isTrackingEnabledSelector = getIsTrackingEnabledSelector();
  const analyticsState = getAnalyticsState();

  if (!analyticsState || !isTrackingEnabledSelector) {
    return false;
  }

  return isTrackingEnabledSelector(analyticsState);
}
