import { useMemo } from "react";
import { getSendFlowTrackingProperties } from "../utils/tracking";
import { useSendFlowData } from "../context/SendFlowContext";

export function useSendFlowTrackingProperties(newSendFlow = true) {
  const { state, source } = useSendFlowData();
  const account = state.account.account;
  const parentAccount = state.account.parentAccount ?? null;

  return useMemo(
    () => getSendFlowTrackingProperties(account, parentAccount, newSendFlow, source),
    [account, parentAccount, newSendFlow, source],
  );
}
