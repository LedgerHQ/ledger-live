import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { Trans } from "~/context/Locale";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";

type UnlockDeviceProps = Readonly<{
  deviceModelId: DeviceModelId;
  deviceName: string;
  testID?: string;
}>;

/**
 * Use this when the device is locked and the user needs to unlock it.
 * Only use this if unlocking the device will automatically resume the flow.
 */
export function UnlockDevice({ deviceModelId, deviceName, testID }: UnlockDeviceProps) {
  const { productName } = getDeviceModel(deviceModelId);

  return (
    <DeviceActionContent
      action="power-and-unlock"
      deviceModelId={deviceModelId}
      deviceName={deviceName}
      title={
        <Trans
          i18nKey="deviceIntentExecutor.genericStates.unlockDevice.title"
          values={{ productName }}
        />
      }
      testID={testID}
    />
  );
}
