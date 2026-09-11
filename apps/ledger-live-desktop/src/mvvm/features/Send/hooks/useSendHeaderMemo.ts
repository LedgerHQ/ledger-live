import { useCallback, useMemo, useRef } from "react";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { Memo } from "@ledgerhq/live-common/flows/send/types";
import { buildRecipientForMemoChange } from "@ledgerhq/live-common/flows/send/utils";
import { getMemoFamilyCurrencyId } from "@ledgerhq/live-common/flows/send/utils/memoFamilyCurrencyId";
import { useFlowWizard } from "../../FlowWizard/FlowWizardContext";
import { useSendFlowActions, useSendFlowData } from "../context/SendFlowContext";
import { useRecipientMemo } from "../screens/Recipient/hooks/useRecipientMemo";
import { track } from "~/renderer/analytics/segment";
import { getSendFlowTrackingProperties } from "../utils/tracking";

export function useSendHeaderMemo() {
  const { state, uiConfig, recipientSearch, isRecipientAddressComplete } = useSendFlowData();
  const { transaction } = useSendFlowActions();
  const { navigation } = useFlowWizard();

  const currencyId = getMemoFamilyCurrencyId(state.account.currency);
  const sendFlowTrackingProperties = useMemo(
    () => getSendFlowTrackingProperties(state.account.account, state.account.parentAccount),
    [state.account.account, state.account.parentAccount],
  );

  const memoDefaultOption = useMemo(() => {
    return sendFeatures.getMemoDefaultOption(state.account.currency ?? undefined);
  }, [state.account.currency]);

  const memoTypeOptions = useMemo(() => {
    return uiConfig.memoOptions ?? [];
  }, [uiConfig]);

  const recipientRef = useRef(state.recipient);
  recipientRef.current = state.recipient;
  const searchValueRef = useRef(recipientSearch.value);
  searchValueRef.current = recipientSearch.value;

  const handleMemoChange = useCallback(
    (memo: Memo) => {
      transaction.setRecipient(
        buildRecipientForMemoChange(searchValueRef.current, recipientRef.current, memo),
      );
    },
    [transaction],
  );

  const handleMemoSkip = useCallback(() => {
    track("button_clicked", {
      button: "skip memo",
      page: "step recipient",
      ...sendFlowTrackingProperties,
    });
    navigation.goToNextStep();
  }, [navigation, sendFlowTrackingProperties]);

  const resetKey = `${state.account.account?.id ?? ""}|${currencyId ?? ""}|${
    isRecipientAddressComplete ? recipientSearch.value : ""
  }`;
  const hasMemo = sendFeatures.hasMemoForRecipient(
    state.account.currency ?? undefined,
    recipientSearch.value,
  );

  const memo = useRecipientMemo({
    hasMemo,
    memoDefaultOption,
    memoType: uiConfig.memoType,
    memoTypeOptions,
    onMemoChange: handleMemoChange,
    onMemoSkip: handleMemoSkip,
    resetKey,
  });

  return {
    ...memo,
    currencyId,
    memoTypeOptions,
  };
}
