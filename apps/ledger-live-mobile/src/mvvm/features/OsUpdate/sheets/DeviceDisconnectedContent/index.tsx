import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { Trans } from "~/context/Locale";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";

type DeviceDisconnectedContentProps = Readonly<{
  deviceModelId: DeviceModelId;
  deviceName: string;
}>;

export function DeviceDisconnectedContent({
  deviceModelId,
  deviceName,
}: DeviceDisconnectedContentProps) {
  const { productName } = getDeviceModel(deviceModelId);

  return (
    <DeviceActionContent
      action="power-and-unlock"
      deviceModelId={deviceModelId}
      deviceName={deviceName}
      title={<Trans i18nKey="osUpdates.deviceDisconnected.title" values={{ productName }} />}
      testID="os-update-device-disconnected"
    />
  );
}
