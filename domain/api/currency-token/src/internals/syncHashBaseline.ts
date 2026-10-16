import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/** `currencyId → persisted hash` that the restored tokens of each currency were saved with. */
export type SyncHashBaselineState = Record<string, string>;

const initialState: SyncHashBaselineState = {};

/**
 * Holds the persisted hash of each restored currency. Until a hash check confirms it, persistence
 * exports this hash, so a save never pairs restored tokens with a hash they were not checked against.
 */
export const syncHashBaselineSlice = createSlice({
  name: "calSyncHashBaseline",
  initialState,
  reducers: {
    baselineSeeded: (state, action: PayloadAction<Record<string, string>>) => ({
      ...state,
      ...action.payload,
    }),
  },
});

export const { baselineSeeded } = syncHashBaselineSlice.actions;

/** Reads the baseline from a state that may not register the slice (then it is empty). */
export function selectSyncHashBaseline(state: {
  [syncHashBaselineSlice.name]?: SyncHashBaselineState;
}): SyncHashBaselineState {
  return state[syncHashBaselineSlice.name] ?? initialState;
}
