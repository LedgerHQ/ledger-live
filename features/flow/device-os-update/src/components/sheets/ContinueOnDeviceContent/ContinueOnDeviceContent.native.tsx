import React from "react";
import {
  DeviceActionContent,
  type DeviceActionModelId,
} from "@features/platform-device-action-content";
import { Trans } from "@shared/i18n";

type ContinueOnDeviceContentProps = Readonly<{
  actionModelId: DeviceActionModelId | null;
  deviceName: string;
  productName: string;
}>;

export function ContinueOnDeviceContent({
  actionModelId,
  deviceName,
  productName,
}: ContinueOnDeviceContentProps) {
  return (
    <DeviceActionContent
      action="continue"
      deviceModelId={actionModelId}
      deviceName={deviceName}
      title={<Trans i18nKey="osUpdates.continueOnDevice.title" values={{ productName }} />}
      description={<Trans i18nKey="osUpdates.continueOnDevice.description" />}
      testID="os-update-continue-on-device"
    />
  );
}
