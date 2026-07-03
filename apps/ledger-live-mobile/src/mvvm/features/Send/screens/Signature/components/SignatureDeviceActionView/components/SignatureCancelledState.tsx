import React from "react";
import { InfoState } from "LLM/components/InfoState";
import { useTranslation } from "~/context/Locale";

type SignatureCancelledStateProps = Readonly<{
  onClose: () => void;
  onRetry: () => void;
}>;

export function SignatureCancelledState({ onClose, onRetry }: SignatureCancelledStateProps) {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="info"
      size="hug"
      title={t("send.newSendFlow.sign.cancelled.title")}
      description={t("send.newSendFlow.sign.cancelled.description")}
      primaryCta={{
        label: t("send.newSendFlow.sign.cancelled.close"),
        onPress: onClose,
        testID: "send-signature-cancelled-close",
      }}
      secondaryCta={{
        label: t("send.newSendFlow.sign.cancelled.retry"),
        onPress: onRetry,
        testID: "send-signature-cancelled-retry",
      }}
      testID="send-signature-cancelled"
    />
  );
}
