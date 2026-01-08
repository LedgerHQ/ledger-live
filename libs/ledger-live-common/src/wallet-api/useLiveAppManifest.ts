import { useMemo } from "react";
import { useLocalLiveAppManifest } from "./LocalLiveAppProvider/index";
import { useRemoteLiveAppManifest } from "../platform/providers/RemoteLiveAppProvider/index";
import { applyCustomDappUrl } from "./manifestDomainUtils";

export function useLiveAppManifest(appId: string | undefined, customDappUrl?: string | null) {
  const localManifest = useLocalLiveAppManifest(appId);
  const remoteManifest = useRemoteLiveAppManifest(appId);

  const manifest = useMemo(() => {
    const baseManifest = localManifest || remoteManifest;
    return applyCustomDappUrl(baseManifest, customDappUrl);
  }, [localManifest, remoteManifest, customDappUrl]);

  return manifest;
}
