import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { OsUpdate } from "@ledgerhq/live-dmk-shared";
import type { State } from "~/reducers/types";

export type OsUpdateState = {
  osUpdates: OsUpdate[];
  /** A backup of the connected device model is stored and has something to restore. */
  hasBackup: boolean;
};

export const INITIAL_STATE: OsUpdateState = {
  osUpdates: [],
  hasBackup: false,
};

const osUpdateSlice = createSlice({
  name: "osUpdate",
  initialState: INITIAL_STATE,
  reducers: {
    setOsUpdates: (state, action: PayloadAction<OsUpdate[]>) => {
      state.osUpdates = action.payload;
    },
    clearOsUpdates: state => {
      state.osUpdates = [];
    },
    setHasBackup: (state, action: PayloadAction<boolean>) => {
      state.hasBackup = action.payload;
    },
  },
});

export const { setOsUpdates, clearOsUpdates, setHasBackup } = osUpdateSlice.actions;

export const osUpdatesSelector = (state: State) => state.osUpdate.osUpdates;
export const hasOsUpdatesSelector = (state: State) => state.osUpdate.osUpdates.length > 0;
export const hasBackupSelector = (state: State) => state.osUpdate.hasBackup;

export default osUpdateSlice.reducer;
