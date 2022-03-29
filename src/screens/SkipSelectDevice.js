// @flow
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { NativeModules } from "react-native";
import { lastConnectedDeviceSelector } from "../reducers/settings";
import { knownDevicesSelector } from "../reducers/ble";

type Props = {
  onResult: (device: any) => void,
  route?: { params: any },
};

export default function SkipSelectDevice({ onResult, route }: Props) {
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const knownDevices = useSelector(knownDevicesSelector);
  const forceSelectDevice = route?.params?.forceSelectDevice;

  useEffect(() => {
    if (!forceSelectDevice && knownDevices?.length > 0 && lastConnectedDevice) {
      NativeModules.BluetoothHelperModule.prompt()
        .then(() => onResult(lastConnectedDevice))
        .catch(() => {
          /* ignore */
        });
    }
  }, [forceSelectDevice, knownDevices?.length, lastConnectedDevice, onResult]);

  return null;
}
