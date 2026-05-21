import React from "react";
import { Trans } from "~/context/Locale";
import { InfoState } from "LLM/components/InfoState";

type DeviceNotOnboardedViewProps = Readonly<{
  productName: string;
  onSetupDevice: () => void;
}>;

export function DeviceNotOnboardedView({
  productName,
  onSetupDevice,
}: DeviceNotOnboardedViewProps) {
  return (
    <InfoState
      preset="info"
      size="hug"
      title={
        <Trans i18nKey="deviceIntentExecutor.initialization.blocking.deviceNotOnboarded.title" />
      }
      description={
        <Trans
          i18nKey="deviceIntentExecutor.initialization.blocking.deviceNotOnboarded.description"
          values={{ productName }}
        />
      }
      primaryCta={{
        label: <Trans i18nKey="deviceIntentExecutor.initialization.cta.setupDevice" />,
        onPress: onSetupDevice,
      }}
      testID="device-initializer-device-not-onboarded"
    />
  );
}
