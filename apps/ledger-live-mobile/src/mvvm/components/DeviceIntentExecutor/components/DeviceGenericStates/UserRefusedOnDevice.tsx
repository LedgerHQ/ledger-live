import React from "react";
import { Trans } from "~/context/Locale";
import { InfoState } from "@shared/ui-info-state";

type UserRefusedOnDeviceProps = Readonly<{
  onClose: () => void;
  onRetry: () => void;
  testID?: string;
}>;

export function UserRefusedOnDevice({ onClose, onRetry, testID }: UserRefusedOnDeviceProps) {
  return (
    <InfoState
      preset="info"
      size="hug"
      title={<Trans i18nKey="deviceIntentExecutor.initialization.retryable.userRefused.title" />}
      primaryCta={{ label: <Trans i18nKey="common.close" />, onPress: onClose }}
      secondaryCta={{ label: <Trans i18nKey="common.retry" />, onPress: onRetry }}
      testID={testID}
    />
  );
}
