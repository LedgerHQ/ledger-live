import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { State } from "~/renderer/reducers";

export interface PtxInfoDialogPayload {
  title: string;
  message: string;
  linkText?: string;
  linkHref?: string;
}

export type PtxInfoDialogState = PtxInfoDialogPayload | null;

const ptxInfoDialogSlice = createSlice({
  name: "ptxInfoDialog",
  initialState: null as PtxInfoDialogState,
  reducers: {
    setPtxInfoDialog: (_state, action: PayloadAction<PtxInfoDialogPayload>) => action.payload,
    clearPtxInfoDialog: () => null,
  },
});

export const { setPtxInfoDialog, clearPtxInfoDialog } = ptxInfoDialogSlice.actions;

export const selectPtxInfoDialogData = (state: Pick<State, "ptxInfoDialog">) => state.ptxInfoDialog;

export const selectIsPtxInfoDialogOpen = (state: Pick<State, "ptxInfoDialog">) =>
  state.ptxInfoDialog !== null;

export default ptxInfoDialogSlice.reducer;
