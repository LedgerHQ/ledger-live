import type { AppAvailabilityStatus } from "../types";

/** First unavailable wins; otherwise any pending; otherwise available. */
export function composeAvailability(
  ...checks: readonly AppAvailabilityStatus[]
): AppAvailabilityStatus {
  for (const check of checks) {
    if (check.status === "unavailable") {
      return check;
    }
  }

  for (const check of checks) {
    if (check.status === "pending") {
      return check;
    }
  }

  return { status: "available" };
}
