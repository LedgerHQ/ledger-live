import { createSlice } from "@reduxjs/toolkit";
import { State } from "~/reducers/types";

export interface RebornBuyDeviceDrawerState {
  isOpen: boolean;
}

export const INITIAL_STATE: RebornBuyDeviceDrawerState = {
  isOpen: false,
};

// Selectors
export const rebornBuyDeviceDrawerStateSelector = (state: State) => state.rebornBuyDeviceDrawer;

const rebornBuyDeviceDrawerSlice = createSlice({
  name: "rebornBuyDeviceDrawerKey",
  initialState: INITIAL_STATE,
  reducers: {
    openRebornBuyDeviceDrawer: state => {
      state.isOpen = true;
    },
    closeRebornBuyDeviceDrawer: state => {
      state.isOpen = false;
    },
  },
});

export const { openRebornBuyDeviceDrawer, closeRebornBuyDeviceDrawer } =
  rebornBuyDeviceDrawerSlice.actions;

export default rebornBuyDeviceDrawerSlice.reducer;
