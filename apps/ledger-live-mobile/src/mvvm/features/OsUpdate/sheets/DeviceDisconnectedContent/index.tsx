import React from "react";
import { InfoState } from "@shared/ui-info-state";
import { Trans } from "~/context/Locale";

export function DeviceDisconnectedContent() {
  return (
    <InfoState
      preset="error"
      size="hug"
      title={<Trans i18nKey="osUpdates.deviceDisconnected.title" />}
      description={<Trans i18nKey="osUpdates.deviceDisconnected.description" />}
      testID="os-update-device-disconnected"
    />
  );
}
