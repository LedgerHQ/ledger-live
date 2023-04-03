import React, { useCallback, useMemo } from "react";
import { useHistory, useLocation } from "react-router-dom";
import useTheme from "~/renderer/hooks/useTheme";
import { Card } from "~/renderer/components/Box";
import WebPlatformPlayer from "~/renderer/components/WebPlatformPlayer";
import { languageSelector } from "~/renderer/reducers/settings";
import { useSelector } from "react-redux";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
type Props = {
  match: {
    params: {
      appId: string;
    };
    isExact: boolean;
    path: string;
    url: string;
  };
  appId?: string;
  location: {
    hash: string;
    params: {
      [key: string]: string;
    };
    pathname: string;
    search: string;
    customDappUrl?: string;
  };
};
export default function PlatformApp({ match, appId: propsAppId, location }: Props) {
  const history = useHistory();
  const { params: internalParams, search } = location;
  const { state: urlParams, customDappUrl } = useLocation();
  const appId = propsAppId || match.params?.appId;
  const returnTo = useMemo(() => {
    const params = new URLSearchParams(search);
    return urlParams?.returnTo || params.get("returnTo") || internalParams?.returnTo;
  }, [search, urlParams?.returnTo, internalParams?.returnTo]);
  const handleClose = useCallback(() => history.push(returnTo || `/platform`), [history, returnTo]);
  const themeType = useTheme("colors.palette.type");
  const lang = useSelector(languageSelector);
  const params = {
    theme: themeType,
    lang,
    ...urlParams,
    ...internalParams,
  };
  const localManifest = useLocalLiveAppManifest(appId);
  const remoteManifest = useRemoteLiveAppManifest(appId);
  let manifest = localManifest || remoteManifest;
  if (customDappUrl) {
    manifest = {
      ...manifest,
      params: {
        ...manifest.params,
        dappUrl: customDappUrl,
      },
    };
  }
  // TODO for next urlscheme evolutions:
  // - check if local settings allow to launch an app from this branch, else display an error
  // - check if the app is available in store, else display a loader if apps are getting fetched from remote, else display an error stating that the app doesn't exist

  return (
    <Card
      grow
      style={{
        overflow: "hidden",
      }}
    >
      {manifest ? (
        <WebPlatformPlayer manifest={manifest} onClose={handleClose} inputs={params} />
      ) : null}
    </Card>
  );
}
