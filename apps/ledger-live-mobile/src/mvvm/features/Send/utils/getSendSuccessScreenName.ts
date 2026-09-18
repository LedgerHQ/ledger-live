import { SEND_FLOW_SOURCE } from "@ledgerhq/live-common/flows/send/types";
import { ScreenName } from "~/const";

export function getSendSuccessScreenName(source?: string) {
  return source === SEND_FLOW_SOURCE.PAY
    ? ScreenName.SendFlowPaySuccess
    : ScreenName.SendFlowConfirmation;
}
