const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export type LastSyncTooltipDescriptor =
  | { key: "topBar.activityIndicator.upToDate" }
  | { key: "topBar.activityIndicator.minutesAgo"; count: number }
  | { key: "topBar.activityIndicator.hoursAgo"; count: number }
  | { key: "topBar.activityIndicator.daysAgo"; count: number };

/**
 * Returns the i18n key and optional params for the "last sync" tooltip
 * based on elapsed time since last sync.
 * - Less than 1 min: "You're up to date"
 * - Less than 1 hour: "Last sync: X mins ago. Tap to refresh"
 * - Less than 24 hours: "Last sync: X hours ago. Tap to refresh"
 * - 24 hours or more: "Last sync: X days ago. Tap to refresh"
 */
export function getLastSyncTooltipDescriptor(elapsedMs: number): LastSyncTooltipDescriptor {
  if (elapsedMs < MS_PER_MINUTE) {
    return { key: "topBar.activityIndicator.upToDate" };
  }
  if (elapsedMs < MS_PER_HOUR) {
    const count = Math.floor(elapsedMs / MS_PER_MINUTE);
    return { key: "topBar.activityIndicator.minutesAgo", count };
  }
  if (elapsedMs < MS_PER_DAY) {
    const count = Math.floor(elapsedMs / MS_PER_HOUR);
    return { key: "topBar.activityIndicator.hoursAgo", count };
  }
  const count = Math.floor(elapsedMs / MS_PER_DAY);
  return { key: "topBar.activityIndicator.daysAgo", count };
}
