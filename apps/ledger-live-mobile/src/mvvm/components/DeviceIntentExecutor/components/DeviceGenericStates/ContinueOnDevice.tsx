import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { Trans } from "~/context/Locale";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";

type ContinueOnDeviceProps = Readonly<{
  deviceModelId: DeviceModelId;
  deviceName: string;
  testID?: string;
}>;

/**
 * Use this whenever an action (other than unlocking the device) is required on the device.
 * For instance, when the user has to sign a transaction, allow a secure connection, confirm the opening of
 * an app, etc.
 */
export function ContinueOnDevice({ deviceModelId, deviceName, testID }: ContinueOnDeviceProps) {
  const { productName } = getDeviceModel(deviceModelId);

  return (
    <DeviceActionContent
      action="continue"
      deviceModelId={deviceModelId}
      deviceName={deviceName}
      title={
        <Trans
          i18nKey="deviceIntentExecutor.genericStates.continueOnDevice.title"
          values={{ productName }}
        />
      }
      description={
        <Trans i18nKey="deviceIntentExecutor.genericStates.continueOnDevice.description" />
      }
      testID={testID}
    />
  );
}
