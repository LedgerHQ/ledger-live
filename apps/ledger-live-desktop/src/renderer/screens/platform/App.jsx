// @flow
import React, { useCallback, useMemo } from "react";
import { useHistory, useLocation } from "react-router-dom";
import useTheme from "~/renderer/hooks/useTheme";

import { Card } from "~/renderer/components/Box";
import WebPlatformPlayer from "~/renderer/components/WebPlatformPlayer";
import { languageSelector } from "~/renderer/reducers/settings";
import { useSelector } from "react-redux";
import { useGetManifest } from "./utils";

type Props = {
  match: {
    params: {
      appId: string,
    },
    isExact: boolean,
    path: string,
    url: string,
  },
  appId?: string,
  location: {
    hash: string,
    params: {
      [key: string]: string,
    },
    pathname: string,
    search: string,
  },
};

export default function PlatformApp({ match, appId: propsAppId, location }: Props) {
  const history = useHistory();
  const { params: internalParams, search, pathname } = location;
  const { state: urlParams } = useLocation();

  const appId = propsAppId || match.params?.appId;

  const returnTo = useMemo(() => {
    const params = new URLSearchParams(search);
    return params.get("returnTo");
  }, [search]);

  const handleClose = useCallback(() => history.push(returnTo || `/platform`), [history, returnTo]);
  const themeType = useTheme("colors.palette.type");
  const lang = useSelector(languageSelector);
  const params = {
    theme: themeType,
    lang,
    ...urlParams,
    ...internalParams,
  };

  const manifest = useGetManifest(appId, params, pathname);

  // TODO for next urlscheme evolutions:
  // - check if local settings allow to launch an app from this branch, else display an error
  // - check if the app is available in store, else display a loader if apps are getting fetched from remote, else display an error stating that the app doesn't exist

  return (
    <Card grow style={{ overflow: "hidden" }}>
      {manifest ? (
        <WebPlatformPlayer manifest={manifest} onClose={handleClose} inputs={params} />
      ) : null}
    </Card>
  );
}
