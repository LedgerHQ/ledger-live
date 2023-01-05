import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";

export const useGetManifest = (appId, genericParams, newpathname) => {
  const localManifest = useLocalLiveAppManifest(appId);
  const remoteManifest = useRemoteLiveAppManifest(appId);
  const manifest = Object.assign({}, localManifest || remoteManifest);

  const oldDappUrl = manifest?.params?.dappUrl;
  const { origin, search } = new URL(oldDappUrl);

  if (newpathname) {
    const { hash, searchParams } = new URL(`https://www.prefix.com${newpathname}`);
    const [realHash, query] = hash.split("?");
    const urlSearchParams = new URLSearchParams(query);
    const allParams = {
      ...genericParams,
      ...Object.fromEntries(new URLSearchParams(search)),
      ...Object.fromEntries(urlSearchParams.entries()),
      ...Object.fromEntries(searchParams),
    };
    const newDappUrl = `${origin}${realHash}?${new URLSearchParams(allParams).toString()}`;
    if (oldDappUrl !== newDappUrl) {
      manifest.params.dappUrl = newDappUrl;
    }
  }

  return manifest;
};
