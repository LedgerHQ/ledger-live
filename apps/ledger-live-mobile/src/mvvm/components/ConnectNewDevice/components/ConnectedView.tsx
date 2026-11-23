import React from "react";
import type { ConnectNewDeviceUIStateTypes } from "@ledgerhq/live-dmk-mobile";
import { useIsNewDevice } from "LLM/components/DeviceConnection";
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
  /** False while an error sheet shows over the view: its page is sent again once it closes. */
  isPageTracked: boolean;
};

const titleKeys = {
  bluetooth: "connectNewDevice.connected.bluetooth.title",
  usb: "connectNewDevice.connected.usb.title",
} as const satisfies Record<DeviceTransport, string>;

export function ConnectedView({
  state,
  isPageTracked,
}: Readonly<ConnectedViewProps>): React.ReactNode {
  const { t } = useTranslation();
  const isNewDevice = useIsNewDevice();
  const { device } = state;

  return (
    <>
      {isPageTracked && (
        <TrackDIEScreen
          category={PAGE_CONNECT_DEVICE.Connected}
          modelId={device.deviceModelId}
          transport={getTrackingTransport(device.transport)}
          isNewDevice={isNewDevice(device)}
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
