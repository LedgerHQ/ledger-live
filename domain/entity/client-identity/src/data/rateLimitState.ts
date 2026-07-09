/**
 * Rate limiting state for push devices sync.
 * Isolated into its own module to allow easy mocking in tests.
 */

let lastFailureTime: number | undefined;

export function getLastFailureTime(): number | undefined {
  return lastFailureTime;
}

export function setLastFailureTime(time: number): void {
  lastFailureTime = time;
}

export function clearLastFailureTime(): void {
  lastFailureTime = undefined;
}
