import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ActionDialogParams } from "@ledgerhq/live-common/wallet-api/validation/actionDialogParams";
import type { State } from "~/renderer/reducers";

export type ActionDialogState = ActionDialogParams | null;

const actionDialogSlice = createSlice({
  name: "actionDialog",
  initialState: null as ActionDialogState,
  reducers: {
    setActionDialog: (_state, action: PayloadAction<ActionDialogParams | null>) => action.payload,
  },
});

export const { setActionDialog } = actionDialogSlice.actions;

export const selectActionDialog = (state: Pick<State, "actionDialog">) => state.actionDialog;

export default actionDialogSlice.reducer;
