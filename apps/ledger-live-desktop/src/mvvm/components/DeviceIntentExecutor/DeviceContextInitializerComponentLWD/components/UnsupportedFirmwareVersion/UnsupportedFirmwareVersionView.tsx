import React from "react";
import { useTranslation } from "react-i18next";
import { InfoState } from "LLD/components/InfoState";

type UnsupportedFirmwareVersionViewProps = Readonly<{
  onUpdateLedgerOs: () => void;
  onCancel: () => void;
}>;

export function UnsupportedFirmwareVersionView({
  onUpdateLedgerOs,
  onCancel,
}: UnsupportedFirmwareVersionViewProps) {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="info"
      size="hug"
      title={t("deviceIntentExecutor.initialization.blocking.unsupportedFirmwareVersion.title")}
      primaryCta={{
        label: t("deviceIntentExecutor.initialization.cta.updateLedgerOs"),
        onPress: onUpdateLedgerOs,
      }}
      secondaryCta={{
        label: t("deviceIntentExecutor.initialization.cta.cancelOperation"),
        onPress: onCancel,
      }}
      testID="device-initializer-unsupported-firmware-version"
    />
  );
}
