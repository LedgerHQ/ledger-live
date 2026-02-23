/**
 * Converts a timestamp to milliseconds, handling both seconds and milliseconds formats.
 * Legacy data might be stored in seconds, so we detect and convert if needed.
 *
 * @param lastUsed - The timestamp value (can be in seconds or milliseconds)
 * @returns The timestamp in milliseconds, or current time if invalid
 */
export function normalizeLastUsedTimestamp(lastUsed: number | undefined): number {
  if (lastUsed && typeof lastUsed === "number" && lastUsed > 0) {
    // Timestamps in seconds are typically < 10^10, timestamps in milliseconds are > 10^12
    // Use year 2000 as threshold: 946684800000 ms = Jan 1, 2000
    const YEAR_2000_MS = 946684800000;
    return lastUsed < YEAR_2000_MS ? lastUsed * 1000 : lastUsed;
  }
  return Date.now();
}

/** i18n context for relative date formatting (avoids coupling utils to react-i18next). */
export type FormatRelativeDateI18n = {
  t: (key: string, options?: { count?: number }) => string;
  locale: string;
};

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

function formatWithI18n(
  t: FormatRelativeDateI18n["t"] | undefined,
  key: string,
  fallback: string,
  options?: { count?: number },
): string {
  return t ? t(key, options) : fallback;
}

const RELATIVE_RANGES: Array<{
  maxDiff: number;
  key: string;
  getCount: (diff: number) => number;
  getFallback: (count: number) => string;
}> = [
  {
    maxDiff: HOUR_MS,
    key: "send.newSendFlow.relativeDate.minutesAgo",
    getCount: diff => Math.max(1, Math.floor(diff / MINUTE_MS)),
    getFallback: count => `${count} min ago`,
  },
  {
    maxDiff: DAY_MS,
    key: "send.newSendFlow.relativeDate.hoursAgo",
    getCount: diff => Math.floor(diff / HOUR_MS),
    getFallback: count => `${count} ${count === 1 ? "hour" : "hours"} ago`,
  },
  {
    maxDiff: WEEK_MS,
    key: "send.newSendFlow.relativeDate.daysAgo",
    getCount: diff => Math.floor(diff / DAY_MS),
    getFallback: count => `${count} ${count === 1 ? "day" : "days"} ago`,
  },
];

/**
 * Formats a date as a relative time (e.g. "2 hours ago") or short date when older.
 * When `i18n` is provided, uses translation keys and locale for month names; otherwise falls back to English (e.g. for tests).
 */
export function formatRelativeDate(date: Date, i18n?: FormatRelativeDateI18n): string {
  const dateTime = date.getTime();
  if (Number.isNaN(dateTime)) return "";

  const diff = Date.now() - dateTime;
  const t = i18n?.t;
  const locale = i18n?.locale ?? "en";

  if (diff <= 0) {
    return formatWithI18n(t, "send.newSendFlow.relativeDate.justNow", "just now");
  }

  const range = RELATIVE_RANGES.find(r => diff < r.maxDiff);
  if (range) {
    const count = range.getCount(diff);
    return formatWithI18n(t, range.key, range.getFallback(count), { count });
  }

  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };
  if (date.getFullYear() !== new Date().getFullYear()) opts.year = "2-digit";

  return new Intl.DateTimeFormat(locale, opts).format(date);
}
