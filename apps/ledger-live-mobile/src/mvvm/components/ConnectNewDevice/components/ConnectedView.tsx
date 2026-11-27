import React from "react";
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

type ConnectedViewProps = {
  state: Extract<
    ConnectNewDeviceNonErrorUIState,
    {
      type:
        | typeof ConnectNewDeviceUIStateTypes.Connected
        | typeof ConnectNewDeviceUIStateTypes.Done;
    }
  >;
  /** True while an error sheet shows over the view: its page is sent again once the sheet closes. */
  isBehindErrorSheet: boolean;
  /** Whether the device is not in the known devices. */
  isNewDevice: boolean;
};

const titleKeys = {
  bluetooth: "connectNewDevice.connected.bluetooth.title",
  usb: "connectNewDevice.connected.usb.title",
} as const satisfies Record<DeviceTransport, string>;

export function ConnectedView({
  state,
  isBehindErrorSheet,
  isNewDevice,
}: Readonly<ConnectedViewProps>): React.ReactNode {
  const { t } = useTranslation();
  const { device } = state;

  return (
    <>
      {!isBehindErrorSheet && (
        <TrackDIEScreen
          category={PAGE_CONNECT_DEVICE.Connected}
          modelId={device.deviceModelId}
          transport={getTrackingTransport(device.transport)}
          isNewDevice={isNewDevice}
          refreshSource
        />
      )}
      <StateLayout
        animation="success"
        loopAnimation={false}
        title={t(titleKeys[getDeviceTransport(device.transport)])}
        testID="connect-new-device-connected"
      />
    </>
  );
}
