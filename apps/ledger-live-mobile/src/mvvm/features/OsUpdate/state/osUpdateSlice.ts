import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { OsUpdate } from "@ledgerhq/live-dmk-shared";
import type { State } from "~/reducers/types";

export type OsUpdateState = {
  osUpdates: OsUpdate[];
};

export const INITIAL_STATE: OsUpdateState = {
  osUpdates: [],
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
  },
});

export const { setOsUpdates, clearOsUpdates } = osUpdateSlice.actions;

export const osUpdatesSelector = (state: State) => state.osUpdate.osUpdates;
export const hasOsUpdatesSelector = (state: State) => state.osUpdate.osUpdates.length > 0;

export default osUpdateSlice.reducer;
