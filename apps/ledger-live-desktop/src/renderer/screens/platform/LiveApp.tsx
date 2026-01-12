import React, { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import useTheme from "~/renderer/hooks/useTheme";
import { Card } from "~/renderer/components/Box";
import WebPlatformPlayer from "~/renderer/components/WebPlatformPlayer";
import { languageSelector } from "~/renderer/reducers/settings";
import { useSelector } from "LLD/hooks/redux";
import { useLiveAppManifest } from "@ledgerhq/live-common/wallet-api/useLiveAppManifest";
import { useTrack } from "~/renderer/analytics/segment";
import { useGetSwapTrackingProperties } from "../exchange/Swap2/utils";

export type LiveAppProps = {
  appId?: string;
};

export function LiveApp({ appId: propsAppId }: LiveAppProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const routeParams = useParams<{ appId: string }>();
  const track = useTrack();
  const swapTrackingProperties = useGetSwapTrackingProperties();
  const { search } = location;
  const internalParams =
    (location as { params?: { [key: string]: string | undefined } }).params || {};
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const urlParams = location.state as {
    returnTo?: string;
    accountId?: string;
    customDappUrl?: string;
    [key: string]: string | undefined;
  } | null;
  const customDappUrl = (location as { customDappUrl?: string }).customDappUrl;
  const appId = propsAppId || routeParams.appId;
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

  const manifest = useLiveAppManifest(appId, _customDappUrl);

  const handleClose = useCallback(() => {
    if (returnTo?.startsWith("/swap")) {
      track("button_click", {
        ...swapTrackingProperties,
        button: "close X",
        partner: appId,
        page: "swap",
      });
    }

    navigate(returnTo || `/platform`);
  }, [navigate, returnTo, appId, swapTrackingProperties, track]);
  const themeType = useTheme().theme;
  const lang = useSelector(languageSelector);
  const params = {
    theme: themeType,
    lang,
    ...urlParams,
    ...internalParams,
  };

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
