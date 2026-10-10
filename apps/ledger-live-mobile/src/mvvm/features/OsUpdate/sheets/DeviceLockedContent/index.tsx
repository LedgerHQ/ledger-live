import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { Trans } from "~/context/Locale";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";

type DeviceLockedContentProps = Readonly<{ deviceModelId: DeviceModelId; deviceName: string }>;

export function DeviceLockedContent({ deviceModelId, deviceName }: DeviceLockedContentProps) {
  const { productName } = getDeviceModel(deviceModelId);

  return (
    <DeviceActionContent
      action="power-and-unlock"
      deviceModelId={deviceModelId}
      deviceName={deviceName}
      title={<Trans i18nKey="osUpdates.unlockDevice.title" values={{ productName }} />}
      testID="os-update-device-locked"
    />
  );
}
