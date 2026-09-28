import { useMemo } from "react";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { getSendFlowTrackingProperties } from "../utils/tracking";
import { useSendFlowData } from "../context/SendFlowContext";

export function useSendFlowTrackingProperties(newSendFlow = true) {
  const { state, source } = useSendFlowData();
  const account = state.account.account;
  const parentAccount = state.account.parentAccount ?? null;
  // Optional chaining: `state.transaction` is required on the real SendFlowState, but this hook
  // is called from many screens whose tests mock `useSendFlowData` with only the `account` slice
  // they exercise -- reading straight through would throw in every one of them.
  const transaction = state.transaction?.transaction;
  const currency = state.account.currency ?? (account ? getAccountCurrency(account) : undefined);

  return useMemo(
    () => ({
      ...getSendFlowTrackingProperties(account, parentAccount, newSendFlow, source),
      ...sendFeatures.getTrackingAttributes(currency ?? undefined, transaction),
    }),
    [account, parentAccount, newSendFlow, source, currency, transaction],
  );
}
