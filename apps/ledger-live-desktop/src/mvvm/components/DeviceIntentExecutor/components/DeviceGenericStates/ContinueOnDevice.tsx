import React from "react";
import { useTranslation } from "react-i18next";
import { getProductName } from "@ledgerhq/devices";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceActionContent } from "LLD/components/DeviceActionContent";

type ContinueOnDeviceProps = Readonly<{
  deviceModelId: DeviceModelId;
  deviceName: string;
  testID?: string;
}>;

export function ContinueOnDevice({ deviceModelId, deviceName, testID }: ContinueOnDeviceProps) {
  const { t } = useTranslation();
  const productName = getProductName(deviceModelId);

  return (
    <DeviceActionContent
      action="continue"
      deviceModelId={deviceModelId}
      deviceName={deviceName}
      title={t("deviceIntentExecutor.genericStates.continueOnDevice.title", { productName })}
      description={t("deviceIntentExecutor.genericStates.continueOnDevice.description")}
      testID={testID}
    />
  );
}
