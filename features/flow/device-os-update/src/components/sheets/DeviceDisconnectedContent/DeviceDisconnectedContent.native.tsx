import React from "react";
import {
  DeviceActionContent,
  type DeviceActionModelId,
} from "@features/platform-device-action-content";
import { Trans } from "@shared/i18n";

type DeviceDisconnectedContentProps = Readonly<{
  actionModelId: DeviceActionModelId | null;
  deviceName: string;
  productName: string;
}>;

export function DeviceDisconnectedContent({
  actionModelId,
  deviceName,
  productName,
}: DeviceDisconnectedContentProps) {
  return (
    <DeviceActionContent
      action="power-and-unlock"
      deviceModelId={actionModelId}
      deviceName={deviceName}
      title={<Trans i18nKey="osUpdates.deviceDisconnected.title" values={{ productName }} />}
      testID="os-update-device-disconnected"
    />
  );
}
