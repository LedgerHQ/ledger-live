// @flow
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { NativeModules } from "react-native";
import { lastConnectedDeviceSelector } from "../reducers/settings";

type Props = {
  onResult: (device: any) => void,
  route?: { params: any },
};

export default function SkipSelectDevice({ onResult, route }: Props) {
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const forceSelectDevice = route?.params?.forceSelectDevice;

  useEffect(() => {
    if (!forceSelectDevice && lastConnectedDevice) {
      NativeModules.BluetoothHelperModule.prompt()
        .then(() => onResult(lastConnectedDevice))
        .catch(() => {
          /* ignore */
        });
    }
  }, [forceSelectDevice, lastConnectedDevice, onResult]);

  return null;
}
