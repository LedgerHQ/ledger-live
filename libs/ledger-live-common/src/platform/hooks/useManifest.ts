import { useMemo } from "react";
import { useRemoteLiveAppManifest } from "../providers/RemoteLiveAppProvider";
import { LiveAppManifest } from "../types";
import { useLocalLiveAppManifest } from "../../wallet-api/LocalLiveAppProvider";

export function useManifest(appId: string): LiveAppManifest | undefined {
  const remoteManifest = useRemoteLiveAppManifest(appId);
  const localManifest = useLocalLiveAppManifest(appId);

  const manifest = useMemo(() => {
    return remoteManifest || localManifest;
  }, [remoteManifest, localManifest]);

  return manifest;
}
