import React from "react";
import type { ConnectNewDeviceUIStateTypes } from "@ledgerhq/live-dmk-mobile";
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
};

const titleKeys = {
  bluetooth: "connectNewDevice.connected.bluetooth.title",
  usb: "connectNewDevice.connected.usb.title",
} as const satisfies Record<DeviceTransport, string>;

export function ConnectedView({ state }: Readonly<ConnectedViewProps>): React.ReactNode {
  const { t } = useTranslation();

  return (
    <StateLayout
      animation="success"
      loopAnimation={false}
      title={t(titleKeys[getDeviceTransport(state.device.transport)])}
      testID="connect-new-device-connected"
    />
  );
}
