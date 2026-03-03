export const SECOND_MS = 1_000;
export const MINUTE_MS = 60_000;
export const HOUR_MS = 3_600_000;
export const DAY_MS = 86_400_000;
export const WEEK_MS = 7 * DAY_MS;

/**
 * Formats a timestamp into a human-readable relative or absolute time label
 * using native Intl APIs (RelativeTimeFormat for < 7 days, DateTimeFormat for older dates).
 *
 * Returns null when the timestamp is less than 1 minute old (caller should
 * treat this as "up to date" and display the appropriate message).
 *
 * @param timestamp - The past timestamp in milliseconds.
 * @param locale - BCP 47 locale string used for formatting (e.g. "en", "fr").
 * @param now - Current time in milliseconds (defaults to Date.now(), injectable for testing).
 */
export function formatTimeAgo(
  timestamp: number,
  locale: string,
  now: number = Date.now(),
): string | null {
  const elapsed = now - timestamp;

  if (elapsed < MINUTE_MS) return null;

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "always" });

  if (elapsed < HOUR_MS) return rtf.format(-Math.floor(elapsed / MINUTE_MS), "minute");
  if (elapsed < DAY_MS) return rtf.format(-Math.floor(elapsed / HOUR_MS), "hour");
  if (elapsed < WEEK_MS) return rtf.format(-Math.floor(elapsed / DAY_MS), "day");

  const date = new Date(timestamp);
  const nowDate = new Date(now);
  if (date.getFullYear() === nowDate.getFullYear()) {
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(date);
  }
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "2-digit",
  }).format(date);
}
