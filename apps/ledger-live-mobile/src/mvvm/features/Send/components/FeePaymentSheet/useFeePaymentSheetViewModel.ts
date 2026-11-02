import { useCallback, useMemo } from "react";
import { Linking } from "react-native";
import { track } from "@shared/analytics";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import type { FeePaymentLabels } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useFeePaymentOptions } from "@ledgerhq/live-common/flows/send/sponsored/useFeePaymentOptions";
import { useTranslation } from "~/context/Locale";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { urls } from "~/utils/urls";
import { useSponsoredSend } from "../../context/SponsoredSendContext";
import { useSendFlowTracking } from "../../context/SendFlowTrackingContext";
import { useSendFlowTrackingProperties } from "../../hooks/useSendFlowTrackingProperties";
import { getSendFlowTrackingPage } from "../../utils/contactTracking";
import type { FeePaymentSheetViewModel } from "./types";

export function useFeePaymentSheetViewModel({
  onDone,
}: Readonly<{ onDone: () => void }>): FeePaymentSheetViewModel {
  const { t } = useTranslation();
  const sponsoredSend = useSponsoredSend();
  const { mainAccount, providerName, feeCurrencyTicker } = sponsoredSend;
  const sendFlowTrackingProperties = useSendFlowTrackingProperties();
  const { flowSessionId } = useSendFlowTracking();

  const nativeTicker = mainAccount?.currency.ticker ?? "";
  const labels: FeePaymentLabels = useMemo(
    () => ({
      sponsored: t("send.newSendFlow.feePayment.sponsored", { provider: providerName }),
      sponsoredPaidIn: t("send.newSendFlow.feePayment.paidIn", { currency: feeCurrencyTicker }),
      regular: t("send.newSendFlow.feePayment.regular"),
      regularPaidIn: t("send.newSendFlow.feePayment.paidIn", { currency: nativeTicker }),
      insufficientFunds: t("send.newSendFlow.feePayment.insufficientFunds", {
        feeCurrency: feeCurrencyTicker,
        provider: providerName,
      }),
    }),
    [t, providerName, feeCurrencyTicker, nativeTicker],
  );
  const { options, pendingId, confirmDisabled, onSelect, confirm, reset } = useFeePaymentOptions({
    ...sponsoredSend,
    labels,
  });

  const onConfirm = useCallback(() => {
    if (confirmDisabled) return;
    track("button_clicked", {
      button: "confirm",
      page: getSendFlowTrackingPage(SEND_FLOW_STEP.FEE_PAYMENT),
      fee_option: pendingId,
      flow_session_id: flowSessionId,
      ...sendFlowTrackingProperties,
    });
    confirm();
    onDone();
  }, [confirmDisabled, pendingId, flowSessionId, sendFlowTrackingProperties, confirm, onDone]);

  const learnMoreUrl = useLocalizedUrl(urls.gasSponsorship);
  const onLearnMore = useCallback(() => {
    if (learnMoreUrl) Linking.openURL(learnMoreUrl);
  }, [learnMoreUrl]);

  return {
    title: t("send.newSendFlow.feePayment.title"),
    disclaimer: t("send.newSendFlow.feePayment.disclaimer", {
      feeCurrency: feeCurrencyTicker,
      provider: providerName,
    }),
    learnMoreLabel: t("common.learnMore"),
    onLearnMore,
    options,
    confirmLabel: t("send.newSendFlow.feePayment.confirm"),
    confirmDisabled,
    onSelect,
    onConfirm,
    onClose: reset,
  };
}
