import React from "react";
import { InfoState } from "LLM/components/InfoState";
import TranslatedError from "~/components/TranslatedError";
import { useTranslation } from "~/context/Locale";

type SignatureErrorStateProps = Readonly<{
  error: Error;
  onClose: () => void;
  onRetry: () => void;
}>;

export function SignatureErrorState({ error, onClose, onRetry }: SignatureErrorStateProps) {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="error"
      size="hug"
      title={<TranslatedError error={error} field="title" />}
      description={<TranslatedError error={error} field="description" />}
      primaryCta={{
        label: t("send.newSendFlow.sign.error.retry"),
        onPress: onRetry,
        testID: "send-signature-error-retry",
      }}
      secondaryCta={{
        label: t("send.newSendFlow.sign.error.close"),
        onPress: onClose,
        testID: "send-signature-error-close",
      }}
      testID="send-signature-error"
    />
  );
}
