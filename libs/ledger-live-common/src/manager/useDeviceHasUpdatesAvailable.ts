import { useState, useEffect } from "react";
import semver from "semver";
import { useEnv } from "../env.react";
import type { DeviceModelInfo } from "@ledgerhq/types-live";
import { getLatestFirmwareForDeviceUseCase } from "../device/use-cases/getLatestFirmwareForDeviceUseCase";
import { getAppsCatalogForDevice } from "../device/use-cases/getAppsCatalogForDevice";

async function hasOutdatedApps({ deviceInfo, apps }: DeviceModelInfo): Promise<boolean> {
  const appsCatalog = await getAppsCatalogForDevice(deviceInfo);
  return apps.some(app => {
    const currApp = appsCatalog.find(e => e.versionName === app.name);
    return currApp && semver.gt(currApp.version, app.version);
  });
}

/**
 * Check if the device has updates available (firmware or apps)
 * @param dmi DeviceModelInfo
 * @returns boolean (true if some updates are available)
 */
export function useDeviceHasUpdatesAvailable(dmi: DeviceModelInfo | null | undefined): boolean {
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
    Promise.all([getLatestFirmwareForDeviceUseCase(deviceInfo), hasOutdatedApps(dmi)])
      .then(([fw, outdatedApp]) => {
        if (cancelled) return;

        if (fw || outdatedApp) {
          setDisplay(true);
          return;
        }

        setDisplay(Boolean(fw || outdatedApp));
      })
      .catch(err => {
        if (cancelled) return;
        console.error(err);
        setDisplay(false);
      });
    return cancel;
  }, [dmi, forceProvider]);
  return display;
}
