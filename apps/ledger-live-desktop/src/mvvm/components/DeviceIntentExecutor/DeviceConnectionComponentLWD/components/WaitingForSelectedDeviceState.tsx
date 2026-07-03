import React from "react";
import { getProductName } from "@ledgerhq/devices";
import { ConnectDeviceUIStateTypes, type ConnectDeviceUIState } from "@ledgerhq/live-dmk-desktop";
import { useTranslation } from "react-i18next";

import { DeviceActionContent } from "LLD/components/DeviceActionContent";

type WaitingForSelectedDeviceStateProps = {
  state: Extract<
    ConnectDeviceUIState,
    { type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice }
  >;
};

function getDeviceName(
  device: WaitingForSelectedDeviceStateProps["state"]["device"],
  fallbackName: string,
): string {
  return device.name ?? fallbackName;
}

export function WaitingForSelectedDeviceState({
  state,
}: Readonly<WaitingForSelectedDeviceStateProps>): React.ReactNode {
  const { t } = useTranslation();
  const productName = getProductName(state.device.deviceModelId);

  return (
    <DeviceActionContent
      action="power-and-unlock"
      deviceModelId={state.device.deviceModelId}
      deviceName={getDeviceName(state.device, productName)}
      title={t("deviceIntentExecutor.connectDevice.states.waitingForSelectedDevice.title", {
        productName,
      })}
      testID="device-intent-executor-connect-device-waiting-for-selected-device"
    />
  );
}
