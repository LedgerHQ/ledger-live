import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { State } from "~/reducers/types";

export interface TransferDrawerState {
  isOpen: boolean;
  sourceScreenName: string;
}

export const INITIAL_STATE: TransferDrawerState = {
  isOpen: false,
  sourceScreenName: "",
};

export const transferDrawerStateSelector = (state: State) => state.transferDrawer;
export const transferDrawerIsOpenSelector = (state: State) => state.transferDrawer.isOpen;

const transferDrawerSlice = createSlice({
  name: "transferDrawer",
  initialState: INITIAL_STATE,
  reducers: {
    openTransferDrawer: (
      state,
      action: PayloadAction<{
        sourceScreenName: string;
      }>,
    ) => {
      state.isOpen = true;
      state.sourceScreenName = action.payload.sourceScreenName;
    },
    closeTransferDrawer: state => {
      state.isOpen = false;
      state.sourceScreenName = "";
    },
  },
});

export const { openTransferDrawer, closeTransferDrawer } = transferDrawerSlice.actions;

export default transferDrawerSlice.reducer;
