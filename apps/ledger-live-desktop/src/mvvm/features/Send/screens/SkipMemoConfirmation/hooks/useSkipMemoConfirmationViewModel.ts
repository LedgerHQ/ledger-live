import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getMemoFamilyCurrencyId } from "@ledgerhq/live-common/flows/send/utils/memoFamilyCurrencyId";
import { useFlowWizard } from "../../../../FlowWizard/FlowWizardContext";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { useDoNotAskAgainSkipMemo } from "../../../hooks/useDoNotAskAgainSkipMemo";
import { getSendFlowTrackingProperties } from "../../../utils/tracking";
import { track } from "~/renderer/analytics/segment";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";

export function useSkipMemoConfirmationViewModel() {
  const { t } = useTranslation();
  const { state } = useSendFlowData();
  const { transaction } = useSendFlowActions();
  const { navigation } = useFlowWizard<SendFlowStep>();
  const [, setDoNotAskAgainSkipMemo] = useDoNotAskAgainSkipMemo();
  const [doNotAskAgain, setDoNotAskAgain] = useState(false);

  const trackingProperties = useMemo(
    () => getSendFlowTrackingProperties(state.account.account, state.account.parentAccount),
    [state.account.account, state.account.parentAccount],
  );
  const memoCurrencyId = getMemoFamilyCurrencyId(state.account.currency);
  const memoLabel = t([`families.${memoCurrencyId}.memo`, "common.memo"]);

  const onConfirm = useCallback(() => {
    if (!state.recipient) return;

    if (doNotAskAgain) {
      setDoNotAskAgainSkipMemo(true);
    }

    transaction.setRecipient({
      ...state.recipient,
      memo: { value: "", type: "NO_MEMO" },
    });
    track("button_clicked", {
      button: "skip memo",
      page: "step memo warning",
      ...trackingProperties,
    });
    navigation.resetToStep(SEND_FLOW_STEP.RECIPIENT);
    navigation.goToStep(SEND_FLOW_STEP.AMOUNT);
  }, [
    doNotAskAgain,
    navigation,
    setDoNotAskAgainSkipMemo,
    state.recipient,
    trackingProperties,
    transaction,
  ]);

  const onCancel = useCallback(() => {
    navigation.resetToStep(SEND_FLOW_STEP.RECIPIENT);
  }, [navigation]);

  const learnMoreUrl = useLocalizedUrl(urls.memoTag.learnMore);
  const onLearnMore = useCallback(() => {
    if (learnMoreUrl) {
      openURL(learnMoreUrl);
    }
  }, [learnMoreUrl]);

  return {
    description: t("newSendFlow.skipMemo.description", { memoLabel }),
    learnMoreLabel: t("common.learnMore"),
    doNotAskAgain,
    doNotAskAgainLabel: t("newSendFlow.skipMemo.neverAskAgain"),
    confirmLabel: t("newSendFlow.skipMemo.confirm", { memoLabel }),
    cancelLabel: t("newSendFlow.skipMemo.cancel"),
    onDoNotAskAgainChange: setDoNotAskAgain,
    onConfirm,
    onCancel,
    onLearnMore,
  };
}
