import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";

const isValidUrl = urlString => {
  try {
    return Boolean(new URL(urlString));
  } catch (e) {
    return false;
  }
};

export const useGetManifest = (appId, genericParams, newpathname = "") => {
  const localManifest = useLocalLiveAppManifest(appId);
  const remoteManifest = useRemoteLiveAppManifest(appId);
  const manifest = Object.assign({}, localManifest || remoteManifest);

  const isLocalPath =
    (typeof newpathname === "string" && newpathname[0] === "/") || newpathname[0] === "#";
  const oldDappUrl = manifest?.params?.dappUrl;
  const isValidOldUrl = isValidUrl(oldDappUrl);
  const newUrl = isLocalPath ? `https://www.prefix.com${newpathname}` : "";
  const isValidNewdUrl = isValidUrl(newUrl);
  if (isLocalPath && isValidOldUrl && isValidNewdUrl) {
    const { origin, search } = new URL(oldDappUrl);
    const { hash, searchParams } = new URL(newUrl);
    const [realHash, query] = hash.split("?");
    const urlSearchParams = new URLSearchParams(query);
    const allParams = {
      ...genericParams,
      ...Object.fromEntries(new URLSearchParams(search)),
      ...Object.fromEntries(urlSearchParams.entries()),
      ...Object.fromEntries(searchParams),
    };

    // paraswap need the hash in the bottom to be connected with ledger wallet.
    const newDappUrl =
      appId === "paraswap"
        ? `${origin}?${new URLSearchParams(allParams).toString()}${realHash}`
        : `${origin}${realHash}?${new URLSearchParams(allParams).toString()}`;
    if (oldDappUrl !== newDappUrl) {
      manifest.params.dappUrl = newDappUrl;
    }
  }

  return manifest;
};
