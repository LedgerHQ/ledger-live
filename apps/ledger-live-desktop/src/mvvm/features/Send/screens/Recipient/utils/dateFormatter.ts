const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

/** i18n context for relative date formatting (avoids coupling utils to react-i18next). */
export type FormatRelativeDateI18n = {
  t: (key: string, options?: { count?: number }) => string;
  locale: string;
};

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

/**
 * Formats a date as a relative time (e.g. "2 hours ago") or short date when older.
 * When `i18n` is provided, uses translation keys and locale for month names; otherwise falls back to English (e.g. for tests).
 */
export function formatRelativeDate(date: Date, i18n?: FormatRelativeDateI18n): string {
  const now = new Date();
  const dateTime = date.getTime();

  if (Number.isNaN(dateTime)) {
    return "";
  }

  const diff = now.getTime() - dateTime;
  const currentYear = now.getFullYear();
  const dateYear = date.getFullYear();

  const t = i18n?.t;
  const locale = i18n?.locale ?? "en";

  if (diff <= 0) {
    return t ? t("newSendFlow.relativeDate.justNow") : "just now";
  }

  if (diff < HOUR_MS) {
    const minutes = Math.max(1, Math.floor(diff / MINUTE_MS));
    return t ? t("newSendFlow.relativeDate.minutesAgo", { count: minutes }) : `${minutes} min ago`;
  }

  if (diff < DAY_MS) {
    const hours = Math.floor(diff / HOUR_MS);
    return t
      ? t("newSendFlow.relativeDate.hoursAgo", { count: hours })
      : `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  if (diff < WEEK_MS) {
    const days = Math.floor(diff / DAY_MS);
    return t
      ? t("newSendFlow.relativeDate.daysAgo", { count: days })
      : `${days} ${days === 1 ? "day" : "days"} ago`;
  }

  const shortDateFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    ...(dateYear !== currentYear ? { year: "2-digit" } : {}),
  });
  return shortDateFormatter.format(date);
}
