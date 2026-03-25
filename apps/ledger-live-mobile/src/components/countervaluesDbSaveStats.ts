import isEqual from "lodash/isEqual";
import { hasNewCountervaluesToExport } from "@ledgerhq/live-countervalues/logic";
import type { CounterValuesState, TrackingPair } from "@ledgerhq/live-countervalues/types";

/** True if countervalues DB export should run: CV slice delta or `trackingPairs` vs last persisted. */
export function shouldPersistCountervaluesExport(params: {
  oldCvState: CounterValuesState;
  newCvState: CounterValuesState;
  currentTrackingPairs: TrackingPair[];
  lastPersistedTrackingPairs: TrackingPair[] | undefined;
}): boolean {
  if (hasNewCountervaluesToExport(params.oldCvState, params.newCvState)) return true;
  if (params.lastPersistedTrackingPairs === undefined) return false;
  return !isEqual(params.currentTrackingPairs, params.lastPersistedTrackingPairs);
}
