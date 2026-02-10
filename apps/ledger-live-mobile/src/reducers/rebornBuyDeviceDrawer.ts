import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { State } from "~/reducers/types";

export interface RebornBuyDeviceDrawerState {
  isOpen: boolean;
  sourceScreenName: string;
}

export const INITIAL_STATE: RebornBuyDeviceDrawerState = {
  isOpen: false,
  sourceScreenName: "",
};

// Selectors
export const rebornBuyDeviceDrawerStateSelector = (state: State) => state.rebornBuyDeviceDrawer;

const rebornBuyDeviceDrawerSlice = createSlice({
  name: "rebornBuyDeviceDrawerKey",
  initialState: INITIAL_STATE,
  reducers: {
    openRebornBuyDeviceDrawer: (
      state,
      action: PayloadAction<{
        sourceScreenName: string;
      }>,
    ) => {
      state.isOpen = true;
      const { sourceScreenName } = action.payload;

      if (sourceScreenName !== undefined) {
        state.sourceScreenName = sourceScreenName;
      }
    },
    closeRebornBuyDeviceDrawer: state => {
      state.isOpen = false;
      state.sourceScreenName = "";
    },

    setSourceScreenName: (state, action: PayloadAction<string>) => {
      state.sourceScreenName = action.payload;
    },
  },
});

export const { openRebornBuyDeviceDrawer, closeRebornBuyDeviceDrawer, setSourceScreenName } =
  rebornBuyDeviceDrawerSlice.actions;

export default rebornBuyDeviceDrawerSlice.reducer;
