import { useEffect, useCallback } from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";
import { useDispatch, useSelector } from "LLD/hooks/redux";

import { areSettingsLoaded, deepLinkUrlSelector } from "~/renderer/reducers/settings";
import { useDeepLinkHandler } from "./useDeepLinkHandler";
import { setDeepLinkUrl } from "~/renderer/actions/settings";

function useDeeplink() {
  const dispatch = useDispatch();
  const openingDeepLink = useSelector(deepLinkUrlSelector);
  const loaded = useSelector(areSettingsLoaded);
  const { handler } = useDeepLinkHandler();

  const handleBackgroundDeeplink = useCallback(
    (_event: IpcRendererEvent, url: string) => handler(url, false),
    [handler],
  );

  useEffect(() => {
    ipcRenderer.on("deep-linking", handleBackgroundDeeplink);
    return () => {
      ipcRenderer.removeListener("deep-linking", handleBackgroundDeeplink);
    };
  }, [handleBackgroundDeeplink]);

  useEffect(() => {
    if (openingDeepLink && loaded) {
      handler(openingDeepLink, true);
      dispatch(setDeepLinkUrl(null));
    }
  }, [loaded, openingDeepLink, dispatch, handler]);
}

export default useDeeplink;
