import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import type { ConnectNewDeviceUIStateTypes } from "@ledgerhq/live-dmk-mobile";
import { TrackDIEScreen } from "LLM/components/DeviceIntentExecutor/components/TrackDIEScreen";
import {
  getTrackingTransport,
  PAGE_CONNECT_DEVICE,
} from "LLM/components/DeviceIntentExecutor/utils/trackDeviceIntent";
import { useTranslation } from "~/context/Locale";
import type { ConnectNewDeviceNonErrorUIState } from "../types";
import { getDeviceTransport, type DeviceTransport } from "../utils/getDeviceTransport";
import { StateLayout } from "./StateLayout";

type ConnectingViewProps = {
  state: Extract<
    ConnectNewDeviceNonErrorUIState,
    { type: typeof ConnectNewDeviceUIStateTypes.Connecting }
  >;
  /** True while an error sheet shows over the view: its page is sent again once the sheet closes. */
  isBehindErrorSheet: boolean;
  /** Whether the device is not in the known devices. */
  isNewDevice: boolean;
};

const titleKeys = {
  bluetooth: "connectNewDevice.connecting.bluetooth.title",
  usb: "connectNewDevice.connecting.usb.title",
} as const satisfies Record<DeviceTransport, string>;

export function ConnectingView({
  state,
  isBehindErrorSheet,
  isNewDevice,
}: Readonly<ConnectingViewProps>): React.ReactNode {
  const { t } = useTranslation();
  const { device } = state;
  const deviceName = device.name ?? t("deviceIntentExecutor.connectDevice.common.ledgerDevice");
  const transport = getDeviceTransport(device.transport);

  return (
    <>
      {!isBehindErrorSheet && (
        <TrackDIEScreen
          category={PAGE_CONNECT_DEVICE.Connecting}
          modelId={device.deviceModelId}
          transport={getTrackingTransport(device.transport)}
          isNewDevice={isNewDevice}
          refreshSource
        />
      )}
      <StateLayout
        animation="loading"
        loopAnimation
        title={t(titleKeys[transport], { deviceName })}
        // Only Bluetooth pairing can show a code on the device.
        description={
          transport === "bluetooth"
            ? t("connectNewDevice.connecting.bluetooth.description", {
                productName: getDeviceModel(device.deviceModelId).productName,
              })
            : undefined
        }
        testID="connect-new-device-connecting"
      />
    </>
  );
}
