import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";

export const useGetManifest = (appId, newHash = "", newSearch = "") => {
  const localManifest = useLocalLiveAppManifest(appId);
  const remoteManifest = useRemoteLiveAppManifest(appId);

  const manifest = Object.assign({}, localManifest || remoteManifest);

  const oldDappUrl = manifest?.params?.dappUrl;
  const { origin, search } = new URL(oldDappUrl);

  const newDappUrl = `${origin}${newHash}${search}${newSearch}`;
  if (newDappUrl !== oldDappUrl) {
    manifest.params.dappUrl = newDappUrl;
  }

  return manifest;
};
