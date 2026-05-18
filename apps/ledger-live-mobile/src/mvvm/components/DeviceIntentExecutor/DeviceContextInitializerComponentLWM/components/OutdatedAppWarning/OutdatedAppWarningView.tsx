import React from "react";
import { Trans } from "~/context/Locale";
import { InfoState } from "LLM/components/InfoState";

type OutdatedAppWarningViewProps = Readonly<{
  appName: string;
  onOpenMyLedger: () => void;
  onContinue: () => void;
}>;

export function OutdatedAppWarningView({
  appName,
  onOpenMyLedger,
  onContinue,
}: OutdatedAppWarningViewProps) {
  return (
    <InfoState
      preset="info"
      size="hug"
      title={<Trans i18nKey="deviceIntentExecutor.initialization.outdatedAppWarning.title" />}
      description={
        <Trans
          i18nKey="deviceIntentExecutor.initialization.outdatedAppWarning.description"
          values={{ appName }}
        />
      }
      primaryCta={{
        label: <Trans i18nKey="deviceIntentExecutor.initialization.cta.openMyLedger" />,
        onPress: onOpenMyLedger,
      }}
      secondaryCta={{
        label: <Trans i18nKey="common.continue" />,
        onPress: onContinue,
      }}
      testID="device-initializer-outdated-app-warning"
    />
  );
}
