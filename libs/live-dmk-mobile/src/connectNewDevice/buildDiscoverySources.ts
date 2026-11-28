import type { DeviceManagementKit, TransportIdentifier } from "@ledgerhq/device-management-kit";
import type { DeviceDiscoverySource } from "@ledgerhq/live-dmk-shared";
import type { Platform } from "react-native";

import type { MobileDiscoveryError } from "../deviceConnectivity/types";
import { MockServerDeviceDiscoverySource } from "../deviceConnectivity/discoveryService/sources/MockServerDeviceDiscoverySource";
import { RnBleDeviceDiscoverySource } from "../deviceConnectivity/discoveryService/sources/RnBleDeviceDiscoverySource";
import { RnHidDeviceDiscoverySource } from "../deviceConnectivity/discoveryService/sources/RnHidDeviceDiscoverySource";
import { SpeculosDeviceDiscoverySource } from "../deviceConnectivity/discoveryService/sources/SpeculosDeviceDiscoverySource";

export const buildDiscoverySources = (
  dmk: DeviceManagementKit,
  platformOS: typeof Platform.OS,
  isMockServerEnabled: boolean,
): Map<TransportIdentifier, DeviceDiscoverySource<MobileDiscoveryError>> => {
  const sources: Array<DeviceDiscoverySource<MobileDiscoveryError>> = isMockServerEnabled
    ? [new MockServerDeviceDiscoverySource(dmk)]
    : [
        new RnBleDeviceDiscoverySource(dmk),
        ...(platformOS === "android" ? [new RnHidDeviceDiscoverySource(dmk)] : []),
        new SpeculosDeviceDiscoverySource(dmk),
      ];

  return new Map(sources.map(source => [source.transportId, source]));
};
