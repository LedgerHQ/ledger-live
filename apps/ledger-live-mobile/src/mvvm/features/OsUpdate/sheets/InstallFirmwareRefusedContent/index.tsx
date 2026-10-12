import React from "react";
import { ErrorContent } from "../ErrorContent";

export function InstallFirmwareRefusedContent({ onCancel }: Readonly<{ onCancel: () => void }>) {
  return (
    <ErrorContent
      i18nKeyPrefix="osUpdates.installFirmwareRefused"
      testID="os-update-install-firmware-refused"
      onCancel={onCancel}
    />
  );
}
