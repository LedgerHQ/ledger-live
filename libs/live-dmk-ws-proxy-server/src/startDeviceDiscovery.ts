import { log } from "@ledgerhq/logs";
import { broadcastToClients, mapDiscoveredDeviceToWsProxyDeviceInfo } from "./messaging";
import type { ProxyRuntimeContext } from "./createProxyContext";

export const startDeviceDiscovery = (runtimeContext: ProxyRuntimeContext): (() => void) => {
  const discoverySubscription = runtimeContext.dmk.listenToAvailableDevices({}).subscribe({
    next: devices => {
      const discoveredDevices = runtimeContext.getDiscoveredDevices();
      const added = devices.filter(d => !discoveredDevices.some(c => c.id === d.id));
      const removed = discoveredDevices.filter(c => !devices.some(d => d.id === c.id));

      for (const device of added) {
        log(
          "proxy",
          `USB device connected: ${device.deviceModel.name} (${device.id.slice(0, 8)}...)`,
        );
      }

      for (const device of removed) {
        log(
          "proxy",
          `USB device disconnected: ${device.deviceModel.name} (${device.id.slice(0, 8)}...)`,
        );
      }

      if (devices.length === 0 && discoveredDevices.length === 0) {
        log("proxy", "No USB devices detected");
      }

      runtimeContext.setDiscoveredDevices(devices);
      broadcastToClients(runtimeContext.clients, {
        type: "discovered-devices-updated",
        discoveredDevices: devices.map(mapDiscoveredDeviceToWsProxyDeviceInfo),
      });
    },
    error: err => {
      log("proxy", `Discovery error: ${String(err)}`);
    },
  });

  return () => {
    discoverySubscription.unsubscribe();
  };
};
