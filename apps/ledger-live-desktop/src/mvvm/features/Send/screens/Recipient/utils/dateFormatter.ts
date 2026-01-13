const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

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
 * Formats a date
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const dateTime = date.getTime();

  if (Number.isNaN(dateTime)) {
    return "";
  }

  const diff = now.getTime() - dateTime;
  const currentYear = now.getFullYear();
  const dateYear = date.getFullYear();

  if (diff <= 0) {
    return "just now";
  }

  if (diff < HOUR_MS) {
    const minutes = Math.max(1, Math.floor(diff / MINUTE_MS));
    return `${minutes} min ago`;
  }

  if (diff < DAY_MS) {
    const hours = Math.floor(diff / HOUR_MS);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  if (diff < WEEK_MS) {
    const days = Math.floor(diff / DAY_MS);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }

  const day = date.getDate();
  const month = date.toLocaleString("en", { month: "short" });

  if (dateYear === currentYear) {
    return `${day} ${month}`;
  }

  const yearShort = String(dateYear).slice(-2);
  return `${day} ${month} ${yearShort}`;
}
