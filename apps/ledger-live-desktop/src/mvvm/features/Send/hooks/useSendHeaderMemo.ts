import { useCallback, useMemo, useRef } from "react";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import {
  buildRecipientForMemoChange,
  getMemoFamilyCurrencyId,
  type Memo,
} from "@features/platform-send-flow";
import { useFlowWizard } from "../../FlowWizard/FlowWizardContext";
import { useSendFlowActions, useSendFlowData } from "../context/SendFlowContext";
import { useRecipientMemo } from "../screens/Recipient/hooks/useRecipientMemo";
import { track } from "@shared/analytics";
import { useSendFlowTrackingProperties } from "./useSendFlowTrackingProperties";

export function useSendHeaderMemo() {
  const { state, uiConfig, recipientSearch, isRecipientAddressComplete } = useSendFlowData();
  const { transaction } = useSendFlowActions();
  const { navigation } = useFlowWizard();

  const currencyId = getMemoFamilyCurrencyId(state.account.currency);
  const sendFlowTrackingProperties = useSendFlowTrackingProperties();

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
