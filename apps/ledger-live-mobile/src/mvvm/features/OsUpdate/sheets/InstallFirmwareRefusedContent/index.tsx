import React from "react";
import { InfoState } from "@shared/ui-info-state";
import { Trans } from "~/context/Locale";

type InstallFirmwareRefusedContentProps = Readonly<{
  productName: string;
  onRetry: () => void;
  onCancel: () => void;
}>;

export function InstallFirmwareRefusedContent({
  productName,
  onRetry,
  onCancel,
}: InstallFirmwareRefusedContentProps) {
  return (
    <InfoState
      preset="info"
      size="hug"
      title={<Trans i18nKey="osUpdates.installFirmwareRefused.title" values={{ productName }} />}
      description={<Trans i18nKey="osUpdates.installFirmwareRefused.description" />}
      primaryCta={{
        label: <Trans i18nKey="osUpdates.installFirmwareRefused.restart" />,
        onPress: onRetry,
      }}
      secondaryCta={{
        label: <Trans i18nKey="osUpdates.installFirmwareRefused.cancel" />,
        onPress: onCancel,
      }}
      testID="os-update-install-firmware-refused"
    />
  );
}
