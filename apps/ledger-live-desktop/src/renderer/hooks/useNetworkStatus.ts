import { useEffect, useState } from "react";

export enum NetworkStatus {
  OFFLINE = "offline",
  ONLINE = "online",
}
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
