import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { discoverDevices } from "@ledgerhq/live-common/hw/index";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { lastConnectedDeviceSelector } from "../reducers/settings";
import { knownDevicesSelector } from "../reducers/ble";
import { AddAccountsNavigatorParamList } from "../components/RootNavigator/types/AddAccountsNavigator";
import { StackNavigatorProps } from "../components/RootNavigator/types/helpers";
import { ReceiveFundsStackParamList } from "../components/RootNavigator/types/ReceiveFundsNavigator";
import { ScreenName } from "../const";
import { usePromptEnableBluetoothCallback } from "../components/RequiresBLE/hooks/useEnableBluetooth";

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

/**
 * Component (defined as a screen) to skip the selection of a device
 * TODO: explain what are the conditions
 *
 * @param onResult callback to call when a device is chosen and selected
 */
export default function SkipSelectDevice({ onResult, route }: Props) {
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const [hasUSB, setHasUSB] = useState(false);
  const knownDevices = useSelector(knownDevicesSelector);
  const forceSelectDevice = route?.params?.forceSelectDevice;
  const promptBluetooth = usePromptEnableBluetoothCallback();
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
      // TODO: need to read and removes this so USB can be used without prompting for bluetooth
      usbTimeout = setTimeout(() => {
        promptBluetooth()
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
    promptBluetooth,
  ]);
  return null;
}
