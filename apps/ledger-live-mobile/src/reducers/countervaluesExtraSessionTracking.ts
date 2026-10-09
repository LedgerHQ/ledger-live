import { createAction, type UnknownAction } from "@reduxjs/toolkit";
import { pairId, type TrackingPair } from "@domain/entity-market-countervalues";
import type { State } from "./types";

// Pairs tracked for this session only, on top of the accounts' own. Never persisted, and kept
// across a countervalues wipe and an app reboot.

/**
 * Adds every pair that is not tracked yet, in one update: a caller with a whole catalog to track
 * would otherwise change the countervalues settings once per pair.
 *
 * Pairs are compared by `pairId`, not by currency identity, because a token refetched from CAL
 * comes back as a new object.
 */
export const addExtraSessionTrackingPairs = createAction<readonly TrackingPair[]>(
  "countervaluesExtraSessionTracking/add",
);

export function addExtraSessionTrackingPair(trackingPair: TrackingPair) {
  return addExtraSessionTrackingPairs([trackingPair]);
}

/**
 * Not `createSlice`: immer would freeze the currency objects the pairs point to, and they are
 * shared with the rest of the app.
 */
export function countervaluesExtraSessionTrackingReducer(
  state: TrackingPair[] = [],
  action: UnknownAction,
): TrackingPair[] {
  if (!addExtraSessionTrackingPairs.match(action)) return state;
  const tracked = new Set(state.map(pairId));
  const missing = action.payload.filter(trackingPair => !tracked.has(pairId(trackingPair)));
  return missing.length === 0 ? state : state.concat(missing);
}

export function extraSessionTrackingPairsSelector(state: State): TrackingPair[] {
  return state.countervaluesExtraSessionTracking;
}
