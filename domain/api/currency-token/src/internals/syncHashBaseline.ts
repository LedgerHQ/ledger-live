import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/** Persisted hashes for restored currencies, and the time each currency's hash last changed. */
export type SyncHashBaselineState = {
  hashes: Record<string, string>;
  changedAt: Record<string, number>;
};

const initialState: SyncHashBaselineState = {
  hashes: {},
  changedAt: {},
};

/**
 * Holds the persisted hash of each restored currency. Until a hash check confirms it, persistence
 * exports this hash, so a save never pairs restored tokens with a hash they were not checked against.
 */
export const syncHashBaselineSlice = createSlice({
  name: "calSyncHashBaseline",
  initialState,
  reducers: {
    baselineSeeded: (state, action: PayloadAction<Record<string, string>>) => {
      state.hashes = { ...state.hashes, ...action.payload };
    },
    hashChanged: (state, action: PayloadAction<{ currencyId: string; at: number }>) => {
      state.changedAt[action.payload.currencyId] = action.payload.at;
    },
  },
});

export const { baselineSeeded, hashChanged } = syncHashBaselineSlice.actions;

function readSyncHashBaseline(state: object): SyncHashBaselineState | undefined {
  return (state as { [syncHashBaselineSlice.name]?: SyncHashBaselineState })[
    syncHashBaselineSlice.name
  ];
}

/** Reads the baseline from a state that may not register the slice (then it is empty). */
export function selectSyncHashBaseline(state: object): Record<string, string> {
  return readSyncHashBaseline(state)?.hashes ?? {};
}

export function selectSyncHashChangedAt(state: object): Record<string, number> {
  return readSyncHashBaseline(state)?.changedAt ?? {};
}
