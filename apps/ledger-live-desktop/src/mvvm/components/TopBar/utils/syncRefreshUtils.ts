/**
 * Returns true if the given timestamp is within the last `windowMs` milliseconds.
 * Used to treat a user sync click as "recent" for manual vs auto refresh loading.
 */
export function isRecentUserSyncClick(timestamp: number, windowMs: number): boolean {
  return Date.now() - timestamp < windowMs;
}
