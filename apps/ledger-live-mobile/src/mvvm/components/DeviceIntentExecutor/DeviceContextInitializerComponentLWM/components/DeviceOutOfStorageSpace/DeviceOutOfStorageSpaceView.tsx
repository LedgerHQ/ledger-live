import React from "react";
import { Trans } from "~/context/Locale";
import { InfoState } from "LLM/components/InfoState";

type DeviceOutOfStorageSpaceViewProps = Readonly<{
  onOpenMyLedger: () => void;
}>;

export function DeviceOutOfStorageSpaceView({ onOpenMyLedger }: DeviceOutOfStorageSpaceViewProps) {
  return (
    <InfoState
      preset="info"
      size="hug"
      title={
        <Trans i18nKey="deviceIntentExecutor.initialization.blocking.deviceOutOfStorageSpace.title" />
      }
      description={
        <Trans i18nKey="deviceIntentExecutor.initialization.blocking.deviceOutOfStorageSpace.description" />
      }
      primaryCta={{
        label: <Trans i18nKey="deviceIntentExecutor.initialization.cta.goToMyLedger" />,
        onPress: onOpenMyLedger,
      }}
      testID="device-initializer-device-out-of-storage-space"
    />
  );
}
