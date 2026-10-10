import React from "react";
import { InfoState } from "@shared/ui-info-state";
import { Trans } from "~/context/Locale";

type ErrorContentProps = Readonly<{
  i18nKeyPrefix: string;
  testID: string;
  onCancel: () => void;
  onRetry?: () => void;
}>;

export function ErrorContent({ i18nKeyPrefix, testID, onCancel, onRetry }: ErrorContentProps) {
  const cancelCta = { label: <Trans i18nKey="osUpdates.actions.cancel" />, onPress: onCancel };

  return (
    <InfoState
      preset="error"
      size="hug"
      title={<Trans i18nKey={`${i18nKeyPrefix}.title`} />}
      description={<Trans i18nKey={`${i18nKeyPrefix}.description`} />}
      primaryCta={
        onRetry
          ? { label: <Trans i18nKey="osUpdates.actions.retry" />, onPress: onRetry }
          : cancelCta
      }
      secondaryCta={onRetry ? cancelCta : undefined}
      testID={testID}
    />
  );
}
