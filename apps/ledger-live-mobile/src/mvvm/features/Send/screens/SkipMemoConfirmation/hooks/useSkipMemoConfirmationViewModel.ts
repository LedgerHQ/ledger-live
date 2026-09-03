import { useCallback, useMemo, useState } from "react";
import { Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getMemoFamilyCurrencyId } from "@ledgerhq/live-common/flows/send/utils/memoFamilyCurrencyId";
import { getSendFlowTrackingProperties } from "@ledgerhq/ledger-wallet-framework/tracking/send";
import { track } from "~/analytics";
import { useTranslation } from "~/context/Locale";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { ScreenName } from "~/const";
import { urls } from "~/utils/urls";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { useSendMemoReset } from "../../../context/SendMemoResetContext";
import { useDoNotAskAgainSkipMemo } from "../../../hooks/useDoNotAskAgainSkipMemo";
import type { SendFlowNavigationProp } from "../../../types";

type UseSkipMemoConfirmationViewModelParams = Readonly<{
  onClose: () => void;
}>;

export function useSkipMemoConfirmationViewModel({
  onClose,
}: UseSkipMemoConfirmationViewModelParams) {
  const { t } = useTranslation();
  const { state } = useSendFlowData();
  const { transaction } = useSendFlowActions();
  const { markMemoSkipped } = useSendMemoReset();
  const navigation = useNavigation<SendFlowNavigationProp>();
  const [, setDoNotAskAgainSkipMemo] = useDoNotAskAgainSkipMemo();
  const [doNotAskAgain, setDoNotAskAgain] = useState(false);

  const trackingProperties = useMemo(
    () => getSendFlowTrackingProperties(state.account.account, state.account.parentAccount),
    [state.account.account, state.account.parentAccount],
  );
  const memoCurrencyId = getMemoFamilyCurrencyId(state.account.currency);
  const memoLabel = t([
    `send.newSendFlow.memoLabel.${memoCurrencyId ?? ""}`,
    "send.newSendFlow.memoLabel.default",
  ]);

  const onConfirm = useCallback(() => {
    if (!state.recipient) return;

    if (doNotAskAgain) {
      setDoNotAskAgainSkipMemo(true);
    }

    markMemoSkipped();
    transaction.setRecipient({
      ...state.recipient,
      memo: { value: "", type: "NO_MEMO" },
    });
    track("button_clicked", {
      button: "skip memo",
      page: "step memo warning",
      ...trackingProperties,
    });
    onClose();
    navigation.navigate(ScreenName.SendFlowAmount);
  }, [
    doNotAskAgain,
    markMemoSkipped,
    navigation,
    onClose,
    setDoNotAskAgainSkipMemo,
    state.recipient,
    trackingProperties,
    transaction,
  ]);

  const onCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const learnMoreUrl = useLocalizedUrl(urls.memoTag);
  const onLearnMore = useCallback(() => {
    if (learnMoreUrl) {
      Linking.openURL(learnMoreUrl);
    }
  }, [learnMoreUrl]);

  return {
    title: t("send.newSendFlow.skipMemo.title", { tag: memoLabel }),
    description: t("send.newSendFlow.skipMemo.description", { tag: memoLabel }),
    learnMoreLabel: t("common.learnMore"),
    doNotAskAgain,
    doNotAskAgainLabel: t("send.newSendFlow.skipMemo.neverAskAgain"),
    confirmLabel: t("send.newSendFlow.skipMemo.confirm", { tag: memoLabel }),
    cancelLabel: t("send.newSendFlow.skipMemo.cancel"),
    onDoNotAskAgainChange: setDoNotAskAgain,
    onConfirm,
    onCancel,
    onLearnMore,
  };
}
