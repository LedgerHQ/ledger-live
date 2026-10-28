import React from "react";
import { getProductName } from "@ledgerhq/devices";
import {
  ConnectDeviceUIStateTypes,
  isBluetoothDevice,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-desktop";
import { useTranslation } from "react-i18next";

import { DeviceActionContent } from "LLD/components/DeviceActionContent";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { PAGE_CONNECT_DEVICE } from "../../utils/trackDeviceIntent";
import type { ConnectionBluetoothViewModel } from "../useConnectionViewModel";
import { ConnectBluetoothAction } from "./ConnectBluetoothAction";

type WaitingForSelectedDeviceStateProps = {
  state: Extract<
    ConnectDeviceUIState,
    { type: typeof ConnectDeviceUIStateTypes.WaitingForSelectedDevice }
  >;
  bluetooth?: ConnectionBluetoothViewModel | null;
};

function getDeviceName(
  device: WaitingForSelectedDeviceStateProps["state"]["device"],
  fallbackName: string,
): string {
  return device.name ?? fallbackName;
}

export function WaitingForSelectedDeviceState({
  state,
  bluetooth,
}: Readonly<WaitingForSelectedDeviceStateProps>): React.ReactNode {
  const { t } = useTranslation();
  const productName = getProductName(state.device.deviceModelId);

  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_DEVICE.WaitingForSelectedDevice}
        modelId={state.device.deviceModelId}
        refreshSource
      />
      <DeviceActionContent
        action="power-and-unlock"
        deviceModelId={state.device.deviceModelId}
        deviceName={getDeviceName(state.device, productName)}
        title={t("deviceIntentExecutor.connectDevice.states.waitingForSelectedDevice.title", {
          productName,
        })}
        testID="device-intent-executor-connect-device-waiting-for-selected-device"
      />
      {/* A Bluetooth device only shows up again after a scan started by a user click. */}
      {bluetooth && isBluetoothDevice(state.device) ? (
        <ConnectBluetoothAction bluetooth={bluetooth} />
      ) : null}
    </>
  );
}
