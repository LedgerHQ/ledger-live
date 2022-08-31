import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { NativeModules } from "react-native";
import { discoverDevices } from "@ledgerhq/live-common/hw/index";
import { lastConnectedDeviceSelector } from "../reducers/settings";
import { knownDevicesSelector } from "../reducers/ble";

type Props = {
  onResult: (device: any) => void;
  route?: {
    params: any;
  };
};
let usbTimeout;
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
