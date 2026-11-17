import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import type { Device } from "@ledgerhq/live-dmk-shared";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";
import { useTranslation } from "~/context/Locale";

type WaitingForSelectedDeviceStateProps = {
  device: Device;
};

function getDeviceName(device: Device, fallbackName: string): string {
  return device.name ?? fallbackName;
}

export function WaitingForSelectedDeviceState({
  device,
}: Readonly<WaitingForSelectedDeviceStateProps>): React.ReactNode {
  const { t } = useTranslation();
  const productName = getDeviceModel(device.deviceModelId).productName;

  return (
    <DeviceActionContent
      action="power-and-unlock"
      deviceModelId={device.deviceModelId}
      deviceName={getDeviceName(
        device,
        t("deviceIntentExecutor.connectDevice.common.ledgerDevice"),
      )}
      title={t("deviceIntentExecutor.connectDevice.states.waitingForSelectedDevice.title", {
        productName,
      })}
    />
  );
}
