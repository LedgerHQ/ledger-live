import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { State } from ".";

/**
 * Display POC flow — global dialog state.
 *
 * Mirrors the Send Flow slice but stays minimal: only the account is needed
 * because the dialog content comes entirely from the coin's `DisplayDescriptor`.
 */
export type DisplayFlowParams = {
  account?: AccountLike;
  parentAccount?: Account;
};

export type DisplayFlowDialogPayload = {
  params?: DisplayFlowParams;
};

export type DisplayFlowState = {
  isOpen: boolean;
  data: DisplayFlowDialogPayload | null;
};

const initialState: DisplayFlowState = {
  isOpen: false,
  data: null,
};

const displayFlowSlice = createSlice({
  name: "displayFlow",
  initialState,
  reducers: {
    openDisplayFlowDialog: (state, action: PayloadAction<DisplayFlowDialogPayload | undefined>) => {
      state.isOpen = true;
      state.data = action.payload ?? { params: {} };
    },
    closeDisplayFlowDialog: state => {
      state.isOpen = false;
      state.data = null;
    },
  },
});

export const displayFlowStateSelector = (state: State) => state.displayFlow;

export const { openDisplayFlowDialog, closeDisplayFlowDialog } = displayFlowSlice.actions;
export default displayFlowSlice.reducer;
