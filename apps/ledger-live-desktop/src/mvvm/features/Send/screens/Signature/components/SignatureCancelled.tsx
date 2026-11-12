import React from "react";
import { useTranslation } from "react-i18next";
import { InfoState } from "@shared/ui-info-state";

type SignatureCancelledProps = Readonly<{
  onClose: () => void;
  onRetry: () => void;
}>;

export function SignatureCancelled({ onClose, onRetry }: SignatureCancelledProps) {
  const { t } = useTranslation();
  const closeCta = {
    label: t("newSendFlow.sign.cancelled.close"),
    onPress: onClose,
    testID: "send-signature-cancelled-close",
  };
  const retryCta = {
    label: t("newSendFlow.sign.cancelled.retry"),
    onPress: onRetry,
    testID: "send-signature-cancelled-retry",
  };

  return (
    <InfoState
      preset="info"
      size="hug"
      title={t("newSendFlow.sign.cancelled.title")}
      description={t("newSendFlow.sign.cancelled.description")}
      primaryCta={closeCta}
      secondaryCta={retryCta}
      testID="send-signature-cancelled"
    />
  );
}
