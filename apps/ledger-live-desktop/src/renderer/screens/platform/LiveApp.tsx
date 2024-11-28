import React, { useCallback, useMemo } from "react";
import { useHistory, useLocation } from "react-router-dom";
import useTheme from "~/renderer/hooks/useTheme";
import { Card } from "~/renderer/components/Box";
import WebPlatformPlayer from "~/renderer/components/WebPlatformPlayer";
import { languageSelector } from "~/renderer/reducers/settings";
import { useSelector } from "react-redux";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { useTrack } from "~/renderer/analytics/segment";
import { useGetSwapTrackingProperties } from "../exchange/Swap2/utils";

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

export function LiveApp({ match, appId: propsAppId, location }: Props) {
  const history = useHistory();
  const track = useTrack();
  const swapTrackingProperties = useGetSwapTrackingProperties();
  const { params: internalParams, search } = location;
  const { state: urlParams, customDappUrl } = useLocation() as ReturnType<typeof useLocation> &
    Props["location"] & {
      state: {
        returnTo: string;
        accountId?: string;
        customDappUrl?: string;
      };
    };
  const appId = propsAppId || match.params?.appId;
  const returnTo = useMemo<string | undefined>(() => {
    const params = new URLSearchParams(search);
    return urlParams?.returnTo || params.get("returnTo") || internalParams?.returnTo;
  }, [search, urlParams?.returnTo, internalParams?.returnTo]);
  const _customDappUrl = useMemo(() => {
    const params = new URLSearchParams(search);
    return (
      customDappUrl ||
      urlParams?.customDappUrl ||
      (params.has("customDappUrl") && params.get("customDappUrl")) ||
      internalParams?.customDappUrl
    );
  }, [search, customDappUrl, urlParams?.customDappUrl, internalParams?.customDappUrl]);

  const handleClose = useCallback(() => {
    if (returnTo?.startsWith("/swap")) {
      track("button_click", {
        ...swapTrackingProperties,
        button: "close X",
        partner: appId,
        page: "swap",
      });
    }

    history.push(returnTo || `/platform`);
  }, [history, returnTo, appId, swapTrackingProperties, track]);
  const themeType = useTheme().colors.palette.type;
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
  if (_customDappUrl && manifest && manifest.params && "dappUrl" in manifest.params) {
    manifest = {
      ...manifest,
      params: {
        ...manifest.params,
        dappUrl: _customDappUrl,
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
