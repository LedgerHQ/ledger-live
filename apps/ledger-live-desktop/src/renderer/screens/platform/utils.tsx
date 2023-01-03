import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";

export const useGetManifest = (appId, pathname) => {
  const localManifest = useLocalLiveAppManifest(appId);
  const remoteManifest = useRemoteLiveAppManifest(appId);

  const manifest = Object.assign({}, localManifest || remoteManifest);

  const sufix = pathname.substr(pathname.indexOf(appId) + appId.length + 1);

  if (sufix !== "" && !manifest?.params?.dappUrl?.includes("#")) {
    const dappUrl = manifest?.params?.dappUrl?.split("?");
    manifest.params.dappUrl =
      dappUrl.length === 1 ? `${dappUrl[0]}${sufix}` : `${dappUrl[0]}${sufix}?${dappUrl[1]}`;
  }

  return manifest;
};
