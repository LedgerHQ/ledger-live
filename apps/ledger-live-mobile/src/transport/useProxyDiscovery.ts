import { useWsProxyDevicesDiscovery } from "@ledgerhq/live-dmk-ws-proxy-client";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import { useEffectiveProxyUrl } from "./useEffectiveProxyUrl";

export const useProxyDiscovery = () => {
  const dmk = useDeviceManagementKit();
  const { effectiveProxyUrl } = useEffectiveProxyUrl();

  const wsProxyState = useWsProxyDevicesDiscovery({
    dmk,
    url: effectiveProxyUrl,
  });

  return {
    proxyDevices: wsProxyState.devices,
  };
};
