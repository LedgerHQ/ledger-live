import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SendFlowInitParams } from "@ledgerhq/live-common/flows/send/types";

export type SendFlowState = Readonly<{
  isOpen: boolean;
  params: SendFlowInitParams | null;
}>;

const initialState: SendFlowState = {
  isOpen: false,
  params: null,
};

const sendFlowSlice = createSlice({
  name: "sendFlow",
  initialState,
  reducers: {
    openSendFlow: (state, action: PayloadAction<SendFlowInitParams>) => {
      state.isOpen = true;
      state.params = action.payload;
    },
    closeSendFlow: state => {
      state.isOpen = false;
      state.params = null;
    },
  },
});

export const { openSendFlow, closeSendFlow } = sendFlowSlice.actions;
export default sendFlowSlice.reducer;

// Selectors
export const sendFlowSelector = (state: { sendFlow: SendFlowState }) => state.sendFlow;
export const selectIsOpen = (state: { sendFlow: SendFlowState }) => state.sendFlow.isOpen;
export const selectParams = (state: { sendFlow: SendFlowState }) => state.sendFlow.params;
