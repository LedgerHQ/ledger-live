import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { Trans } from "~/context/Locale";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";

type ContinueOnDeviceContentProps = Readonly<{ deviceModelId: DeviceModelId; deviceName: string }>;

export function ContinueOnDeviceContent({
  deviceModelId,
  deviceName,
}: ContinueOnDeviceContentProps) {
  const { productName } = getDeviceModel(deviceModelId);

  return (
    <DeviceActionContent
      action="continue"
      deviceModelId={deviceModelId}
      deviceName={deviceName}
      title={<Trans i18nKey="osUpdates.continueOnDevice.title" values={{ productName }} />}
      description={<Trans i18nKey="osUpdates.continueOnDevice.description" />}
      testID="os-update-continue-on-device"
    />
  );
}
