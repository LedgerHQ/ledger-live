import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { NativeModules } from "react-native";
import { discoverDevices } from "@ledgerhq/live-common/hw/index";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { lastConnectedDeviceSelector } from "../reducers/settings";
import { knownDevicesSelector } from "../reducers/ble";
import { AddAccountsNavigatorParamList } from "../components/RootNavigator/types/AddAccountsNavigator";
import { StackNavigatorProps } from "../components/RootNavigator/types/helpers";
import { ReceiveFundsStackParamList } from "../components/RootNavigator/types/ReceiveFundsNavigator";
import { ScreenName } from "../const";

type Navigation =
  | StackNavigatorProps<
      AddAccountsNavigatorParamList,
      ScreenName.AddAccountsSelectDevice
    >
  | StackNavigatorProps<
      ReceiveFundsStackParamList,
      ScreenName.ReceiveAddAccountSelectDevice
    >
  | StackNavigatorProps<
      ReceiveFundsStackParamList,
      ScreenName.ReceiveConnectDevice
    >;

type Props = {
  onResult: (device: Device) => void;
  route?: Navigation["route"] & { params: { forceSelectDevice?: boolean } };
};
let usbTimeout: ReturnType<typeof setTimeout>;
export default function SkipSelectDevice({ onResult, route }: Props) {
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const [hasUSB, setHasUSB] = useState(false);
  const knownDevices = useSelector(knownDevicesSelector);
  const forceSelectDevice = route?.params?.forceSelectDevice;
  useEffect(() => {
    const subscription = discoverDevices(() => true).subscribe(e => {
      setHasUSB(e.id.startsWith("usb|"));
    });
    return () => subscription.unsubscribe();
  }, [knownDevices]);
  useEffect(() => {
    if (
      !forceSelectDevice &&
      knownDevices?.length > 0 &&
      !hasUSB &&
      lastConnectedDevice
    ) {
      // timeout so we have the time to detect usb connection
      usbTimeout = setTimeout(() => {
        NativeModules.BluetoothHelperModule.prompt()
          .then(() => onResult(lastConnectedDevice))
          .catch(() => {
            /* ignore */
          });
      }, 500);
    } else {
      clearTimeout(usbTimeout);
    }
  }, [
    forceSelectDevice,
    hasUSB,
    knownDevices?.length,
    lastConnectedDevice,
    onResult,
  ]);
  return null;
}
