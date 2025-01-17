import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { useMemo } from "react";
import { DEFAULT_SWAP_APP_ID } from "../consts";

export function useSwapLiveAppManifest() {
  const ptxSwapLiveApp = useFeature("ptxSwapLiveApp");

  const manifestIdToUse = useMemo(() => {
    return ptxSwapLiveApp?.enabled && ptxSwapLiveApp.params?.manifest_id
      ? ptxSwapLiveApp.params?.manifest_id
      : DEFAULT_SWAP_APP_ID;
  }, [ptxSwapLiveApp?.enabled, ptxSwapLiveApp?.params?.manifest_id]);

  const localManifest: LiveAppManifest | undefined = useLocalLiveAppManifest(manifestIdToUse);
  const remoteManifest: LiveAppManifest | undefined = useRemoteLiveAppManifest(manifestIdToUse);

  return !localManifest ? remoteManifest : localManifest;
}