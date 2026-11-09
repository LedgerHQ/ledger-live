import { SEND_FLOW_SOURCE } from "@features/platform-send-flow";
import { ScreenName } from "~/const";

export function getSendSuccessScreenName(source?: string) {
  return source === SEND_FLOW_SOURCE.PAY
    ? ScreenName.SendFlowPaySuccess
    : ScreenName.SendFlowConfirmation;
}
