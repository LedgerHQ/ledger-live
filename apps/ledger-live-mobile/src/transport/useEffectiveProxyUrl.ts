import { useCallback } from "react";
import Config from "react-native-config";
import { useDispatch, useSelector } from "~/context/hooks";
import { setWsProxyUrl } from "~/actions/settings";
import { wsProxyUrlSelector } from "~/reducers/settings";

export const useEffectiveProxyUrl = () => {
  const dispatch = useDispatch();

  const storeProxyUrl = useSelector(wsProxyUrlSelector);
  const envProxyUrl = Config.DEVICE_PROXY_URL ?? null;
  const effectiveProxyUrl = storeProxyUrl ?? envProxyUrl;

  const setProxyUrl = useCallback(
    (url: string) => {
      dispatch(setWsProxyUrl(url));
    },
    [dispatch],
  );

  const clearProxyUrl = useCallback(() => {
    dispatch(setWsProxyUrl(null));
  }, [dispatch]);

  return {
    storeProxyUrl,
    envProxyUrl,
    effectiveProxyUrl,
    setProxyUrl,
    clearProxyUrl,
  };
};
