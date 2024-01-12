import { useState, useEffect } from "react";
import semver from "semver";
import { useEnv } from "../env.react";
import manager from ".";
import { getProviderId } from "./provider";
import ManagerAPI from "./api";
import type { DeviceModelInfo, DeviceInfo, Language } from "@ledgerhq/types-live";

async function hasOudatedApps({ deviceInfo, apps }: DeviceModelInfo): Promise<boolean> {
  const provider = getProviderId(deviceInfo);
  const deviceVersion = await ManagerAPI.getDeviceVersion(deviceInfo.targetId, provider);
  const firmware = await ManagerAPI.getCurrentFirmware({
    deviceId: deviceVersion.id,
    version: deviceInfo.version,
    provider,
  });
  const compatibleAppVersionsList = await ManagerAPI.applicationsByDevice({
    provider,
    current_se_firmware_final_version: firmware.id,
    device_version: deviceVersion.id,
  });
  return apps.some(app => {
    const currApp = compatibleAppVersionsList.find(e => e.name === app.name);
    return currApp && semver.gt(currApp.version, app.version);
  });
}

export function useManagerBlueDot(dmi: DeviceModelInfo | null | undefined): boolean {
  const [display, setDisplay] = useState(!dmi);
  const forceProvider = useEnv("FORCE_PROVIDER");
  useEffect(() => {
    let cancelled = false;

    function cancel() {
      cancelled = true;
    }

    if (!dmi) {
      setDisplay(true);
      return cancel;
    }

    const { deviceInfo } = dmi;
    Promise.all([manager.getLatestFirmwareForDevice(deviceInfo), hasOudatedApps(dmi)])
      .then(([fw, outdatedApp]) => {
        if (cancelled) return;

        if (fw || outdatedApp) {
          setDisplay(true);
          return;
        }

        setDisplay(Boolean(fw || outdatedApp));
      })
      .catch(err => {
        console.error(err);
        setDisplay(false);
      });
    return cancel;
  }, [dmi, forceProvider]);
  return display;
}

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
