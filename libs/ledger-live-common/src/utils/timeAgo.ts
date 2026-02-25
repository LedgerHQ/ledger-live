export const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
export const WEEK_MS = 7 * DAY_MS;

export type TimeAgoResult =
  | { key: "justNow" }
  | { key: "minutesAgo"; count: number }
  | { key: "hoursAgo"; count: number }
  | { key: "daysAgo"; count: number }
  | { key: "dateInYear"; timestamp: number }
  | { key: "dateAcrossYears"; timestamp: number };

/**
 * Returns a structured time-ago result from a timestamp.
 * Pure function with no i18n dependency — consumers are responsible for formatting.
 *
 * @param timestamp - The past timestamp in milliseconds.
 * @param now - Current time in milliseconds (defaults to Date.now(), injectable for testing).
 */
export function getTimeAgo(timestamp: number, now: number = Date.now()): TimeAgoResult {
  const elapsed = now - timestamp;

  if (elapsed < MINUTE_MS) return { key: "justNow" };
  if (elapsed < HOUR_MS) return { key: "minutesAgo", count: Math.floor(elapsed / MINUTE_MS) };
  if (elapsed < DAY_MS) return { key: "hoursAgo", count: Math.floor(elapsed / HOUR_MS) };
  if (elapsed < WEEK_MS) return { key: "daysAgo", count: Math.floor(elapsed / DAY_MS) };

  const timestampDate = new Date(timestamp);
  const nowDate = new Date(now);
  if (timestampDate.getFullYear() === nowDate.getFullYear()) {
    return { key: "dateInYear", timestamp };
  }
  return { key: "dateAcrossYears", timestamp };
}
