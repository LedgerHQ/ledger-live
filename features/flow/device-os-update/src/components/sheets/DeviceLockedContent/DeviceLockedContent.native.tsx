import React from "react";
import {
  DeviceActionContent,
  type DeviceActionModelId,
} from "@features/platform-device-action-content";
import { Trans } from "@shared/i18n";

type DeviceLockedContentProps = Readonly<{
  actionModelId: DeviceActionModelId | null;
  deviceName: string;
  productName: string;
}>;

export function DeviceLockedContent({
  actionModelId,
  deviceName,
  productName,
}: DeviceLockedContentProps) {
  return (
    <DeviceActionContent
      action="power-and-unlock"
      deviceModelId={actionModelId}
      deviceName={deviceName}
      title={<Trans i18nKey="osUpdates.unlockDevice.title" values={{ productName }} />}
      testID="os-update-device-locked"
    />
  );
}
