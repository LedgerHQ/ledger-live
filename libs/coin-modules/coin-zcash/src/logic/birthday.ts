/**
 * Unix timestamp (seconds) of a birthday date. The scan start and the height the
 * UI shows for that date both go through it, so they always read the same instant.
 */
export function birthdayTimestamp(birthday: string): number {
  return Math.floor(new Date(birthday).getTime() / 1000);
}
