import { useState, useEffect } from "react";
import manager from ".";
import type { DeviceInfo, Language } from "@ledgerhq/types-live";

export const useAvailableLanguagesForDevice = (
  deviceInfo?: DeviceInfo | null,
): { availableLanguages: Language[]; loaded: boolean; error: Error | null } => {
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let dead = false;
    if (deviceInfo) {
      manager.getAvailableLanguagesDevice(deviceInfo).then(
        languages => {
          if (dead) return;
          setAvailableLanguages(languages);
          setError(null);
          setLoaded(true);
        },
        error => {
          if (dead) return;
          setAvailableLanguages([]);
          setError(error);
          setLoaded(true);
        },
      );
    }
    return () => {
      dead = true;
    };
  }, [deviceInfo]);

  return { availableLanguages, loaded, error };
};
