import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { SwapTransactionStatusParams } from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import type { State } from "~/reducers/types";

export type SwapTransactionStatusDrawerState = {
  isOpen: boolean;
  params: SwapTransactionStatusParams | null;
};

export const INITIAL_STATE: SwapTransactionStatusDrawerState = {
  isOpen: false,
  params: null,
};

export const swapTransactionStatusDrawerSelector = (state: State) =>
  state.swapTransactionStatusDrawer;
export const selectIsSwapTransactionStatusDrawerOpen = (state: State) =>
  state.swapTransactionStatusDrawer.isOpen;
export const selectSwapTransactionStatusDrawerParams = (state: State) =>
  state.swapTransactionStatusDrawer.params;

const swapTransactionStatusDrawerSlice = createSlice({
  name: "swapTransactionStatusDrawer",
  initialState: INITIAL_STATE,
  reducers: {
    openSwapTransactionStatusDrawer: (
      state,
      action: PayloadAction<SwapTransactionStatusParams>,
    ) => {
      state.isOpen = true;
      state.params = action.payload;
    },
    closeSwapTransactionStatusDrawer: state => {
      state.isOpen = false;
      state.params = null;
    },
  },
});

export const { openSwapTransactionStatusDrawer, closeSwapTransactionStatusDrawer } =
  swapTransactionStatusDrawerSlice.actions;

export default swapTransactionStatusDrawerSlice.reducer;
