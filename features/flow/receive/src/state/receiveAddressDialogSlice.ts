import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ReceiveAddressDialogState, ReceiveAddressDialogTarget } from "./types";

export const receiveAddressDialogInitialState: ReceiveAddressDialogState = { target: null };

/** The receive address dialog on desktop: what it shows, `null` while it is closed. */
export const receiveAddressDialogSlice = createSlice({
  name: "receiveAddressDialog",
  initialState: receiveAddressDialogInitialState,
  reducers: {
    openReceiveAddressDialog: (_, action: PayloadAction<ReceiveAddressDialogTarget>) => ({
      target: action.payload,
    }),
    closeReceiveAddressDialog: () => receiveAddressDialogInitialState,
  },
  selectors: {
    selectReceiveAddressDialogTarget: state => state.target,
  },
});

export const { openReceiveAddressDialog, closeReceiveAddressDialog } =
  receiveAddressDialogSlice.actions;
export const { selectReceiveAddressDialogTarget } = receiveAddressDialogSlice.selectors;
