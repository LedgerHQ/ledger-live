import React from "react";
import { useTranslation } from "react-i18next";
import { InfoState } from "@shared/ui-info-state";
import TranslatedError from "~/renderer/components/TranslatedError";

type SignatureErrorProps = Readonly<{
  error: Error;
  onClose: () => void;
  onRetry: () => void;
}>;

export function SignatureError({ error, onClose, onRetry }: SignatureErrorProps) {
  const { t } = useTranslation();
  const retryCta = {
    label: t("common.retry"),
    onPress: onRetry,
    testID: "send-signature-error-retry",
  };
  const closeCta = {
    label: t("common.close"),
    onPress: onClose,
    testID: "send-signature-error-close",
  };

  return (
    <InfoState
      preset="error"
      size="hug"
      title={<TranslatedError error={error} field="title" />}
      description={<TranslatedError error={error} field="description" />}
      primaryCta={retryCta}
      secondaryCta={closeCta}
      testID="send-signature-error"
    />
  );
}
