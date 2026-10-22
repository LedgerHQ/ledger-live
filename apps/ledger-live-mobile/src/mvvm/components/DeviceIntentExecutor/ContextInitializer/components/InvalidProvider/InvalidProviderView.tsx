import React from "react";
import { Trans } from "~/context/Locale";
import { InfoState } from "@shared/ui-info-state";

type InvalidProviderViewProps = Readonly<{
  onGoToSettings: () => void;
}>;

export function InvalidProviderView({ onGoToSettings }: InvalidProviderViewProps) {
  return (
    <InfoState
      preset="error"
      size="hug"
      title={<Trans i18nKey="deviceIntentExecutor.initialization.blocking.invalidProvider.title" />}
      description={
        <Trans i18nKey="deviceIntentExecutor.initialization.blocking.invalidProvider.description" />
      }
      primaryCta={{
        label: <Trans i18nKey="deviceIntentExecutor.initialization.cta.goToSettings" />,
        onPress: onGoToSettings,
      }}
      testID="device-initializer-invalid-provider"
    />
  );
}
