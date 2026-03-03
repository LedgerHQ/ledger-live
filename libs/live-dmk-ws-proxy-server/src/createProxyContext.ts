import {
  ConsoleLogger,
  DeviceManagementKitBuilder,
  LogLevel,
  type DeviceManagementKit,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import type WebSocket from "ws";
import { nodeHidTransportFactory } from "@ledgerhq/device-transport-kit-node-hid";
import { DEFAULT_PROXY_PORT, type ProxyJobOpts } from "./types";

export type ProxyRuntimeContext = {
  resolvedPort: string;
  dmk: DeviceManagementKit;
  clients: Set<WebSocket>;
  getDiscoveredDevices: () => DiscoveredDevice[];
  setDiscoveredDevices: (devices: DiscoveredDevice[]) => void;
};

export const createProxyContext = ({ port }: Partial<ProxyJobOpts>): ProxyRuntimeContext => {
  let discoveredDevices: DiscoveredDevice[] = [];

  return {
    resolvedPort: port || DEFAULT_PROXY_PORT,
    dmk: new DeviceManagementKitBuilder()
      .addTransport(nodeHidTransportFactory)
      .addLogger(new ConsoleLogger(LogLevel.Debug))
      .build(),
    clients: new Set<WebSocket>(),
    getDiscoveredDevices: () => discoveredDevices,
    setDiscoveredDevices: devices => {
      discoveredDevices = devices;
    },
  };
};
