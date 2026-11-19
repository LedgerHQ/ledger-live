import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type RecordStatus = "pending" | "loaded" | "empty" | "failed" | "locked";

export type PersistenceState = {
  records: Record<string, RecordStatus>;
};

export type PersistenceRootState = { persistence: PersistenceState };

const initialState: PersistenceState = { records: {} };

export const persistenceSlice = createSlice({
  name: "persistence",
  initialState,
  reducers: {
    recordsHydrationStarted: (state, action: PayloadAction<string[]>) => {
      for (const key of action.payload) state.records[key] = "pending";
    },
    recordStatusChanged: (state, action: PayloadAction<{ key: string; status: RecordStatus }>) => {
      state.records[action.payload.key] = action.payload.status;
    },
  },
  selectors: {
    selectRecordStatus: (state, key: string): RecordStatus | undefined => state.records[key],
    selectUsesPersistence: (state, key: string): boolean => state.records[key] !== undefined,
  },
});

export const { recordsHydrationStarted, recordStatusChanged } = persistenceSlice.actions;

export const { selectRecordStatus, selectUsesPersistence } = persistenceSlice.selectors;

export const isWritableStatus = (status: RecordStatus | undefined): boolean =>
  status === "loaded" || status === "empty";
