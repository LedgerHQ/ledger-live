import { useEffect, useState } from "react";
import type { DiscoveredDevice, DeviceId } from "@ledgerhq/device-management-kit";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { log } from "@ledgerhq/logs";
import { WS_PROXY_IDENTIFIER, setWsProxyUrl } from "../transport/WsProxyTransport";

export type WsProxyDiscoveredDevice = {
  deviceId: DeviceId;
  deviceName: string;
  wired: true;
  modelId: DeviceModelId;
  discoveredDevice: DiscoveredDevice;
};

export type WsProxyDiscoveryState = {
  devices: WsProxyDiscoveredDevice[];
  error: Error | null;
};

const mapDiscoveredDevice = (device: DiscoveredDevice): WsProxyDiscoveredDevice => ({
  deviceId: `wsHidProxy|${device.id}`,
  deviceName: device.deviceModel.name ?? device.name ?? "Ledger Device",
  wired: true,
  modelId: dmkToLedgerDeviceIdMap[device.deviceModel.model],
  discoveredDevice: device,
});

type UseWsProxyDevicesDiscoveryParams = {
  /**
   * The global DMK instance (from useDeviceManagementKit hook).
   * Passed explicitly to avoid coupling this package to live-dmk-mobile.
   */
  dmk: {
    listenToAvailableDevices: (params: {
      transport: string;
    }) => import("rxjs").Observable<DiscoveredDevice[]>;
    stopDiscovering: () => void;
  } | null;
  /** Effective proxy URL selected by the caller. */
  url: string | null;
};

/**
 * React hook for discovering Ledger devices through a WebSocket proxy server.
 * Follows the same pattern as useHidDevicesDiscovery and useBleDevicesScanning.
 * The caller is responsible for selecting which URL should be active.
 */
export const useWsProxyDevicesDiscovery = ({
  dmk,
  url,
}: UseWsProxyDevicesDiscoveryParams): WsProxyDiscoveryState => {
  const [devices, setDevices] = useState<WsProxyDiscoveredDevice[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // Push active URL to transport. Pass null to close proxy connection.
  useEffect(() => {
    setWsProxyUrl(url);
  }, [url]);

  useEffect(() => {
    if (!dmk || !url) {
      setDevices([]);
      return;
    }

    setError(null);
    log("useWsProxyDevicesDiscovery", "starting discovery", { url });

    const subscription = dmk
      .listenToAvailableDevices({ transport: WS_PROXY_IDENTIFIER })
      .subscribe({
        next: discoveredDevices => {
          const mapped = discoveredDevices.map(mapDiscoveredDevice);
          setDevices(prev => {
            if (
              prev.length === mapped.length &&
              prev.every((d, i) => d.deviceId === mapped[i].deviceId)
            ) {
              return prev;
            }
            return mapped;
          });
        },
        error: err => {
          setError(err);
          log("useWsProxyDevicesDiscovery", "error", { error: err });
        },
      });

    return () => {
      log("useWsProxyDevicesDiscovery", "cleanup — unsubscribing");
      subscription.unsubscribe();
    };
  }, [dmk, url]);

  return { devices, error };
};
