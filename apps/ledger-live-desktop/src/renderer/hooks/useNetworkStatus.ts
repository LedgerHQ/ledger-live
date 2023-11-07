import { useEffect, useState } from "react";

export enum NetworkStatus {
  OFFLINE = "offline",
  ONLINE = "online",
}

/**
 * hook that use HTML5 Navigator API of the browser used by Electron
 * navigator.onLine is the online status (boolean)
 * window.addEventListener('online'|'offline') listens on changes in the network state
 * https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine
 *
 * @returns { networkStatus: NetworkStatus }
 */

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(
    navigator.onLine ? NetworkStatus.ONLINE : NetworkStatus.OFFLINE,
  );

  useEffect(() => {
    const onlineListener = () => setNetworkStatus(NetworkStatus.ONLINE);
    const offlineListener = () => setNetworkStatus(NetworkStatus.OFFLINE);
    window.addEventListener(NetworkStatus.ONLINE, onlineListener);
    window.addEventListener(NetworkStatus.OFFLINE, offlineListener);

    return () => {
      window.removeEventListener(NetworkStatus.ONLINE, onlineListener);
      window.removeEventListener(NetworkStatus.OFFLINE, offlineListener);
    };
  }, []);

  return { networkStatus };
};
