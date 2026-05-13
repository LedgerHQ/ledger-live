import React from "react";
import { Trans } from "~/context/Locale";
import { InfoState } from "LLM/components/InfoState";

type UnsupportedFirmwareVersionViewProps = Readonly<{
  onUpdateLedgerOs: () => void;
  onCancel: () => void;
}>;

export function UnsupportedFirmwareVersionView({
  onUpdateLedgerOs,
  onCancel,
}: UnsupportedFirmwareVersionViewProps) {
  return (
    <InfoState
      preset="info"
      size="hug"
      title={
        <Trans i18nKey="deviceIntentExecutor.initialization.blocking.unsupportedFirmwareVersion.title" />
      }
      primaryCta={{
        label: <Trans i18nKey="deviceIntentExecutor.initialization.cta.updateLedgerOs" />,
        onPress: onUpdateLedgerOs,
      }}
      secondaryCta={{
        label: <Trans i18nKey="deviceIntentExecutor.initialization.cta.cancelOperation" />,
        onPress: onCancel,
      }}
      testID="device-initializer-unsupported-firmware-version"
    />
  );
}
