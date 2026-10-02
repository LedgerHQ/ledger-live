import { useCallback } from "react";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { track } from "~/analytics";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { useSendFlowTracking } from "../../../context/SendFlowTrackingContext";
import { useSendFlowTrackingProperties } from "../../../hooks/useSendFlowTrackingProperties";
import { getActiveWarningsTrackingProperties } from "../../../utils/tracking";
import { getActiveWarningIds } from "../../../utils/messageTracking";

const USER_REFUSED_ERROR_NAMES = new Set(["UserRefusedOnDevice", "TransactionRefusedOnDevice"]);

function getErrorName(error: unknown): string {
  if (typeof error === "object" && error !== null && "name" in error) {
    return String(error.name);
  }
  return "Error";
}

export function useSignatureTracking() {
  const { state } = useSendFlowData();
  const { flowSessionId, trackMessage } = useSendFlowTracking();
  const sendFlowTrackingProperties = useSendFlowTrackingProperties();
  const { account, parentAccount } = state.account;
  const txStatus = state.transaction.status;

  const trackDeviceConfirmation = useCallback(() => {
    track("button_clicked", {
      button: "confirm on device",
      page: "step signature",
      flow_session_id: flowSessionId,
      ...getActiveWarningsTrackingProperties(txStatus ? getActiveWarningIds(txStatus) : []),
      ...sendFlowTrackingProperties,
    });
  }, [flowSessionId, sendFlowTrackingProperties, txStatus]);

  const trackSignatureError = useCallback(
    (error: unknown) => {
      const messageId = getErrorName(error);
      if (USER_REFUSED_ERROR_NAMES.has(messageId)) return;

      trackMessage({
        account,
        parentAccount,
        step: SEND_FLOW_STEP.SIGNATURE,
        message: { messageId, messageType: "error" },
      });
    },
    [account, parentAccount, trackMessage],
  );

  return { trackDeviceConfirmation, trackSignatureError };
}
