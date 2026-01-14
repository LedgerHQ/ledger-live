import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { State } from ".";

export type SendFlowParams = {
  account?: AccountLike;
  parentAccount?: Account;
  recipient?: string;
  amount?: string;
  memo?: string;
  fromMAD?: boolean;
  startWithWarning?: boolean;
};

export type SendFlowDialogPayload = {
  params?: SendFlowParams;
  onClose?: () => void;
};

export type SendFlowState = {
  isOpen: boolean;
  data: SendFlowDialogPayload | null;
};

const initialState: SendFlowState = {
  isOpen: false,
  data: null,
};

const sendFlowSlice = createSlice({
  name: "sendFlow",
  initialState,
  reducers: {
    openSendFlowDialog: (state, action: PayloadAction<SendFlowDialogPayload | undefined>) => {
      state.isOpen = true;
      state.data = action.payload ?? { params: {} };
    },
    closeSendFlowDialog: state => {
      state.isOpen = false;
      state.data = null;
    },
  },
});

export const sendFlowStateSelector = (state: State) => state.sendFlow;
export const sendFlowIsOpenSelector = (state: State) => state.sendFlow.isOpen;
export const sendFlowDataSelector = (state: State) => state.sendFlow.data;

export const { openSendFlowDialog, closeSendFlowDialog } = sendFlowSlice.actions;
export default sendFlowSlice.reducer;
