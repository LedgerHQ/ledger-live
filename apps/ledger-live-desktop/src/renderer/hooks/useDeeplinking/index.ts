import { useEffect } from "react";
import { ipcRenderer } from "electron";
import { useDispatch, useSelector } from "react-redux";
import { areSettingsLoaded, deepLinkUrlSelector } from "~/renderer/reducers/settings";
import { useDeepLinkHandler } from "./useDeepLinkHandler";
import { setDeepLinkUrl } from "~/renderer/actions/settings";

function useDeeplink() {
  const dispatch = useDispatch();
  const openingDeepLink = useSelector(deepLinkUrlSelector);
  const loaded = useSelector(areSettingsLoaded);
  const { handler } = useDeepLinkHandler();
  useEffect(() => {
    ipcRenderer.on("deep-linking", handler);
    return () => {
      ipcRenderer.removeListener("deep-linking", handler);
    };
  }, [handler]);
  useEffect(() => {
    if (openingDeepLink && loaded) {
      handler(null, openingDeepLink);
      dispatch(setDeepLinkUrl(null));
    }
  }, [loaded, openingDeepLink, dispatch, handler]);
}
export default useDeeplink;
