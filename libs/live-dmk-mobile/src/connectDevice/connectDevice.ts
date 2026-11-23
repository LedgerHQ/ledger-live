import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { mockserverIdentifier } from "@ledgerhq/device-transport-kit-mockserver";
import {
  connectDeviceUseCase,
  DefaultDeviceDiscoveryService,
  type DeviceConnectionResult,
  type KnownDevice,
} from "@ledgerhq/live-dmk-shared";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { Platform } from "react-native";
import type { Observable } from "rxjs";

import type { MobileDiscoveryError } from "../deviceConnectivity/types";
import type { MobileConnectDeviceUIState } from "./types";
import { buildDiscoverySources } from "../connectNewDevice/buildDiscoverySources";
import { buildMobileCompatDeviceId, createConnectionError, filterMatchedDevices } from "./utils";

export type ConnectDeviceInput = {
  knownDevices: Array<KnownDevice>;
  acceptedDeviceModelIds?: Array<DeviceModelId>;
  dmk: DeviceManagementKit;
  onConnected: (result: DeviceConnectionResult) => void;
  isMockServerEnabled: boolean;
};

export function connectDevice(input: ConnectDeviceInput): Observable<MobileConnectDeviceUIState> {
  // Only mock devices can be discovered in mock mode: a physical known device would never match.
  const knownDevices = input.isMockServerEnabled
    ? input.knownDevices.filter(device => device.transport === mockserverIdentifier)
    : input.knownDevices;

  return connectDeviceUseCase({
    ...input,
    knownDevices,
    deviceDiscoveryService: new DefaultDeviceDiscoveryService<MobileDiscoveryError>(
      buildDiscoverySources(input.dmk, Platform.OS, input.isMockServerEnabled),
    ),
    matchDiscoveredDevices: filterMatchedDevices,
    mapConnectionError: createConnectionError,
    buildCompatDeviceId: buildMobileCompatDeviceId,
    connectNewDevice: null,
  });
}
