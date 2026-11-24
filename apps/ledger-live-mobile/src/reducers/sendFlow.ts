import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SendFlowInitParams } from "@ledgerhq/live-common/flows/send/types";

export type SendFlowState = Readonly<{
  isOpen: boolean;
  params: SendFlowInitParams | null;
}>;

export const INITIAL_STATE: SendFlowState = {
  isOpen: false,
  params: null,
};

const sendFlowSlice = createSlice({
  name: "sendFlow",
  initialState: INITIAL_STATE,
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
