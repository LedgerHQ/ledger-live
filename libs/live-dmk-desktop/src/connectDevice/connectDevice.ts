import type { DeviceManagementKit, TransportIdentifier } from "@ledgerhq/device-management-kit";
import {
  connectDeviceUseCase,
  DefaultDeviceDiscoveryService,
  type DeviceConnectionResult,
  type DeviceDiscoverySource,
  type KnownDevice,
} from "@ledgerhq/live-dmk-shared";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { Observable } from "rxjs";

import { WebHidDeviceDiscoverySource } from "./discoveryService/sources/WebHidDeviceDiscoverySource";
import { type DesktopConnectDeviceUIState, type DesktopDiscoveryError } from "./types";
import { createConnectionError, filterMatchedDevices } from "./utils";

export type ConnectDeviceInput = {
  knownDevices: Array<KnownDevice>;
  acceptedDeviceModelIds?: Array<DeviceModelId>;
  dmk: DeviceManagementKit;
  onConnected: (result: DeviceConnectionResult) => void;
};

export function connectDevice(input: ConnectDeviceInput): Observable<DesktopConnectDeviceUIState> {
  const webHidSource = new WebHidDeviceDiscoverySource(input.dmk);
  const discoverySources: Map<
    TransportIdentifier,
    DeviceDiscoverySource<DesktopDiscoveryError>
  > = new Map();
  discoverySources.set(webHidSource.transportId, webHidSource);

  return connectDeviceUseCase({
    ...input,
    deviceDiscoveryService: new DefaultDeviceDiscoveryService<DesktopDiscoveryError>(
      discoverySources,
    ),
    matchDiscoveredDevices: filterMatchedDevices,
    mapConnectionError: createConnectionError,
  });
}
