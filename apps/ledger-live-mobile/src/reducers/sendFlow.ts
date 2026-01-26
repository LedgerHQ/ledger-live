import { handleActions } from "redux-actions";
import type { SendFlowInitParams } from "@ledgerhq/live-common/flows/send/types";
import { OPEN_SEND_FLOW, CLOSE_SEND_FLOW } from "../actions/sendFlow";

export type SendFlowState = Readonly<{
  isOpen: boolean;
  params: SendFlowInitParams | null;
}>;

export const INITIAL_STATE: SendFlowState = {
  isOpen: false,
  params: null,
};

const initialState = INITIAL_STATE;

const handlers = {
  [OPEN_SEND_FLOW]: (state: SendFlowState, action: { payload: SendFlowInitParams }) => ({
    ...state,
    isOpen: true,
    params: action.payload,
  }),
  [CLOSE_SEND_FLOW]: (state: SendFlowState) => ({
    ...state,
    isOpen: false,
    params: null,
  }),
};

export default handleActions(handlers, initialState);

// Selector
export const sendFlowSelector = (state: { sendFlow: SendFlowState }) => state.sendFlow;
