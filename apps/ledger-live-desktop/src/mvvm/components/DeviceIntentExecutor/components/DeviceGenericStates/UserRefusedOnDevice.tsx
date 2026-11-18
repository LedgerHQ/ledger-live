import React from "react";
import { useTranslation } from "react-i18next";
import { InfoState } from "@shared/ui-info-state";

type UserRefusedOnDeviceProps = Readonly<{
  onClose: () => void;
  onRetry: () => void;
  testID?: string;
}>;

export function UserRefusedOnDevice({ onClose, onRetry, testID }: UserRefusedOnDeviceProps) {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="info"
      size="hug"
      title={t("deviceIntentExecutor.initialization.retryable.userRefused.title")}
      primaryCta={{ label: t("common.close"), onPress: onClose }}
      secondaryCta={{ label: t("common.retry"), onPress: onRetry }}
      testID={testID}
    />
  );
}
