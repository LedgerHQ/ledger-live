export const AUTO_LOCK_OPTIONS = [
  { value: 1, id: "oneMinute" },
  { value: 10, id: "tenMinutes" },
  { value: 30, id: "thirtyMinutes" },
  { value: 60, id: "oneHour" },
  { value: -1, id: "never" },
] as const;

/** The auto-lock timeout a select value stands for, `null` when it is none of the options. */
export function parseAutoLockTimeout(value: string): number | null {
  const option = AUTO_LOCK_OPTIONS.find(candidate => String(candidate.value) === value);
  return option ? option.value : null;
}
