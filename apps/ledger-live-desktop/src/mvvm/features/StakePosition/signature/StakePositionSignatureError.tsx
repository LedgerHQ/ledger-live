import React from "react";
import { useTranslation } from "react-i18next";
import { InfoState } from "@shared/ui-info-state";
import TranslatedError from "~/renderer/components/TranslatedError";

type StakePositionSignatureErrorProps = Readonly<{
  error: Error;
  onClose: () => void;
  onRetry: () => void;
}>;

/** The device step failed before the exit was signed: the user retries it or leaves. */
export function StakePositionSignatureError({
  error,
  onClose,
  onRetry,
}: StakePositionSignatureErrorProps) {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="error"
      size="hug"
      title={<TranslatedError error={error} field="title" />}
      description={<TranslatedError error={error} field="description" />}
      primaryCta={{
        label: t("common.retry"),
        onPress: onRetry,
        testID: "stake-position-signature-error-retry",
      }}
      secondaryCta={{
        label: t("common.close"),
        onPress: onClose,
        testID: "stake-position-signature-error-close",
      }}
      testID="stake-position-signature-error"
    />
  );
}
