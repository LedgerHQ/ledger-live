import { useEffect, useCallback } from "react";
import { INITIAL_PLATFORM_STATE } from "../constants";
import type { LiveAppManifest } from "../../platform/types";
import type { LocalLiveApp, LocalLiveAppDB } from "./types";

export function useLocalLiveApp([LocalLiveAppDb, setState]: LocalLiveAppDB): LocalLiveApp {
  useEffect(() => {
    if (LocalLiveAppDb === undefined) {
      setState(discoverDB => {
        return { ...discoverDB, localLiveApp: INITIAL_PLATFORM_STATE.localLiveApp };
      });
    }
  }, [LocalLiveAppDb, setState]);

  const addLocalManifest = useCallback(
    (newLocalManifest: LiveAppManifest) => {
      setState(discoverDB => {
        const newLocalLiveAppList = discoverDB.localLiveApp?.filter(
          manifest => manifest.id !== newLocalManifest.id,
        );

        newLocalLiveAppList.push(newLocalManifest);
        return { ...discoverDB, localLiveApp: newLocalLiveAppList };
      });
    },
    [setState],
  );

  const removeLocalManifestById = useCallback(
    (manifestId: string) => {
      setState(discoverDB => {
        const newLocalLiveAppList = discoverDB.localLiveApp.filter(
          manifest => manifest.id !== manifestId,
        );

        return { ...discoverDB, localLiveApp: newLocalLiveAppList };
      });
    },
    [setState],
  );

  const getLocalLiveAppManifestById = useCallback(
    (manifestId: string): LiveAppManifest | undefined => {
      return LocalLiveAppDb.find(manifest => manifest.id === manifestId);
    },
    [LocalLiveAppDb],
  );

  return {
    state: LocalLiveAppDb,
    addLocalManifest,
    removeLocalManifestById,
    getLocalLiveAppManifestById,
  };
}
