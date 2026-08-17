import { getTrackingSelector } from "./registry";
import type { TrackingResult } from "./types";

/**
 * | Situation                                        | Result                                     |
 * | ------------------------------------------------ | ------------------------------------------ |
 * | no tracking selector registered                  | enabled — always-on, the CLI depends on it |
 * | selector registered, no state                    | disabled, `"store not initialised"`        |
 * | selector returns false, `mandatory` falsy        | disabled, `"analytics not enabled"`        |
 * | selector returns false, `mandatory` true         | enabled, with the *mandatory* enricher     |
 */
export function getIsTracking(
  state: unknown | null | undefined,
  mandatory?: boolean | null,
): TrackingResult {
  const trackingSelector = getTrackingSelector();
  if (!trackingSelector) return { enabled: true };
  if (!state) return { enabled: false, reason: "store not initialised" };
  if (!mandatory && !trackingSelector(state)) {
    return { enabled: false, reason: "analytics not enabled" };
  }
  return { enabled: true };
}
