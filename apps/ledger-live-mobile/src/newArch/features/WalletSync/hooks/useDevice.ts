import { useEffect, useState } from "react";
import DeviceInfo from "react-native-device-info";

export function useDevice() {
  const [device, setDevice] = useState<string>();
  useEffect(() => {
    async function getDeviceInfo() {
      const deviceInfo = await DeviceInfo.getDeviceName();
      setDevice(deviceInfo);
    }

    getDeviceInfo();
  }, []);

  return { device };
}
