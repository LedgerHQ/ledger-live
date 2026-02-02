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
