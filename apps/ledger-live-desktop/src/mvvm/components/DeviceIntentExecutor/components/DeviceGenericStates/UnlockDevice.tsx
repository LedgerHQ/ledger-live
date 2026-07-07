import React from "react";
import { useTranslation } from "react-i18next";
import { getProductName } from "@ledgerhq/devices";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceActionContent } from "LLD/components/DeviceActionContent";

type UnlockDeviceProps = Readonly<{
  deviceModelId: DeviceModelId;
  deviceName: string;
  testID?: string;
}>;

export function UnlockDevice({ deviceModelId, deviceName, testID }: UnlockDeviceProps) {
  const { t } = useTranslation();
  const productName = getProductName(deviceModelId);

  return (
    <DeviceActionContent
      action="power-and-unlock"
      deviceModelId={deviceModelId}
      deviceName={deviceName}
      title={t("deviceIntentExecutor.genericStates.unlockDevice.title", { productName })}
      testID={testID}
    />
  );
}
