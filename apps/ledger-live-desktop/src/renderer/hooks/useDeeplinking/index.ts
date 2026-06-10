import { useEffect, useCallback, useRef } from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useFeature } from "@features/platform-feature-flags";

import { areSettingsLoaded, deepLinkUrlSelector } from "~/renderer/reducers/settings";
import { isLocked as isLockedSelector } from "~/renderer/reducers/application";
import { useDeepLinkHandler } from "./useDeepLinkHandler";
import { setDeepLinkUrl } from "~/renderer/actions/settings";

function useDeeplink() {
  const dispatch = useDispatch();
  const openingDeepLink = useSelector(deepLinkUrlSelector);
  const loaded = useSelector(areSettingsLoaded);
  const isLocked = useSelector(isLockedSelector);
  const isDeeplinkOpenHardeningEnabled = useFeature("lwdDeeplinkOpenHardening")?.enabled === true;
  const { handler } = useDeepLinkHandler();

  // Background deeplinks received while the app is locked are queued in memory so they can be
  // replayed with triggeredAppStart: false, keeping them distinct from startup deeplinks
  // (which flow through settings.deepLinkUrl and replay with triggeredAppStart: true).
  const pendingBackgroundDeepLink = useRef<string | null>(null);

  const handleBackgroundDeeplink = useCallback(
    (_event: IpcRendererEvent, url: string) => {
      if (isDeeplinkOpenHardeningEnabled && isLocked) {
        pendingBackgroundDeepLink.current = url;
        return;
      }

      handler(url, false);
    },
    [handler, isDeeplinkOpenHardeningEnabled, isLocked],
  );

  useEffect(() => {
    ipcRenderer.on("deep-linking", handleBackgroundDeeplink);
    return () => {
      ipcRenderer.removeListener("deep-linking", handleBackgroundDeeplink);
    };
  }, [handleBackgroundDeeplink]);

  useEffect(() => {
    if (openingDeepLink && loaded) {
      if (isDeeplinkOpenHardeningEnabled && isLocked) {
        return;
      }

      handler(openingDeepLink, true);
      dispatch(setDeepLinkUrl(null));
    }
  }, [loaded, openingDeepLink, dispatch, handler, isDeeplinkOpenHardeningEnabled, isLocked]);

  useEffect(() => {
    if (!isLocked && pendingBackgroundDeepLink.current) {
      const url = pendingBackgroundDeepLink.current;
      pendingBackgroundDeepLink.current = null;
      handler(url, false);
    }
  }, [isLocked, handler]);
}

export default useDeeplink;
