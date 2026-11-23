import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import type { ConnectNewDeviceUIStateTypes } from "@ledgerhq/live-dmk-mobile";
import { useTranslation } from "~/context/Locale";
import type { ConnectNewDeviceNonErrorUIState, StateLayoutComponent } from "../types";
import { getDeviceTransport, type DeviceTransport } from "../utils/getDeviceTransport";

type ConnectingViewProps = {
  state: Extract<
    ConnectNewDeviceNonErrorUIState,
    { type: typeof ConnectNewDeviceUIStateTypes.Connecting }
  >;
  Layout: StateLayoutComponent;
};

const titleKeys = {
  bluetooth: "connectNewDevice.connecting.bluetooth.title",
  usb: "connectNewDevice.connecting.usb.title",
} as const satisfies Record<DeviceTransport, string>;

export function ConnectingView({ state, Layout }: Readonly<ConnectingViewProps>): React.ReactNode {
  const { t } = useTranslation();
  const { device } = state;
  const deviceName = device.name ?? t("deviceIntentExecutor.connectDevice.common.ledgerDevice");
  const transport = getDeviceTransport(device.transport);

  return (
    <Layout
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
  );
}
