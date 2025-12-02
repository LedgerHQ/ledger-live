const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

/**
 * Formats a date
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const currentYear = now.getFullYear();
  const dateYear = date.getFullYear();

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
