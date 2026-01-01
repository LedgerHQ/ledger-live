/**
 * Rate limiting state management
 * This module manages the rate limiting state for push devices sync.
 * It's separated into its own module to allow easy mocking in tests.
 */

let lastFailureTime: number | undefined;

/**
 * Get the last failure time
 */
export function getLastFailureTime(): number | undefined {
  return lastFailureTime;
}

/**
 * Set the last failure time
 */
export function setLastFailureTime(time: number): void {
  lastFailureTime = time;
}

/**
 * Clear the last failure time
 */
export function clearLastFailureTime(): void {
  lastFailureTime = undefined;
}
