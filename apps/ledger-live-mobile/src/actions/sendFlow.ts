import type { SendFlowInitParams } from "@ledgerhq/live-common/flows/send/types";

export const OPEN_SEND_FLOW = "OPEN_SEND_FLOW";
export const CLOSE_SEND_FLOW = "CLOSE_SEND_FLOW";

export type OpenSendFlowPayload = SendFlowInitParams;

export const openSendFlow = (params: OpenSendFlowPayload) => ({
  type: OPEN_SEND_FLOW,
  payload: params,
});

export const closeSendFlow = () => ({
  type: CLOSE_SEND_FLOW,
});
