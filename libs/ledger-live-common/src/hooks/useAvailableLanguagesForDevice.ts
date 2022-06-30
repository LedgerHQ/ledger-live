import { useEffect, useState } from "react";
import manager from "../manager";
import { Language } from "../types/languages";
import { DeviceInfo } from "../types/manager";

const useAvailableLanguagesForDevice = (deviceInfo: DeviceInfo): Language[] => {
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);

  useEffect(() => {
    if (deviceInfo) {
      manager.getAvailableLanguagesDevice(deviceInfo).then(setAvailableLanguages);
    }
  }, [deviceInfo, setAvailableLanguages]);

  return availableLanguages;
};

export default useAvailableLanguagesForDevice;