import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { DeviceOsUpdateState, OsUpdate } from "./schema";

export const deviceOsUpdateInitialState: DeviceOsUpdateState = {
  osUpdates: [],
  hasBackup: false,
};

export const deviceOsUpdateSlice = createSlice({
  name: "deviceOsUpdate",
  initialState: deviceOsUpdateInitialState,
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

export const { setOsUpdates, clearOsUpdates, setHasBackup } = deviceOsUpdateSlice.actions;

export default deviceOsUpdateSlice.reducer;
