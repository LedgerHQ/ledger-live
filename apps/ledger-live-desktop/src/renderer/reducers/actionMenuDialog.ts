import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ActionMenuDialogParams } from "@ledgerhq/live-common/wallet-api/validation/actionMenuDialogParams";
import type { State } from "~/renderer/reducers";

export type ActionMenuDialogState = ActionMenuDialogParams | null;

const actionMenuDialogSlice = createSlice({
  name: "actionMenuDialog",
  initialState: null as ActionMenuDialogState,
  reducers: {
    setActionMenuDialog: (_state, action: PayloadAction<ActionMenuDialogParams | null>) =>
      action.payload,
  },
});

export const { setActionMenuDialog } = actionMenuDialogSlice.actions;

export const selectActionMenuDialog = (state: Pick<State, "actionMenuDialog">) =>
  state.actionMenuDialog;

export default actionMenuDialogSlice.reducer;
