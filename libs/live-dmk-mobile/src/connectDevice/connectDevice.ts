import type { DeviceManagementKit, TransportIdentifier } from "@ledgerhq/device-management-kit";
import {
  connectDeviceUseCase,
  DefaultDeviceDiscoveryService,
  type DeviceDiscoverySource,
  type DeviceConnectionResult,
  type KnownDevice,
} from "@ledgerhq/live-dmk-shared";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { Observable } from "rxjs";

import { type MobileConnectDeviceUIState, type MobileDiscoveryError } from "./types";
import { RnBleDeviceDiscoverySource } from "./discoveryService/sources/RnBleDeviceDiscoverySource";
import { RnHidDeviceDiscoverySource } from "./discoveryService/sources/RnHidDeviceDiscoverySource";
import { createConnectionError, filterMatchedDevices } from "./utils";

export type ConnectDeviceInput = {
  knownDevices: Array<KnownDevice>;
  acceptedDeviceModelIds?: Array<DeviceModelId>;
  dmk: DeviceManagementKit;
  onConnected: (result: DeviceConnectionResult) => void;
};

export function connectDevice(input: ConnectDeviceInput): Observable<MobileConnectDeviceUIState> {
  const rnHidSource = new RnHidDeviceDiscoverySource(input.dmk);
  const rnBleSource = new RnBleDeviceDiscoverySource(input.dmk);
  const discoverySources: Map<
    TransportIdentifier,
    DeviceDiscoverySource<MobileDiscoveryError>
  > = new Map();
  discoverySources.set(rnHidSource.transportId, rnHidSource);
  discoverySources.set(rnBleSource.transportId, rnBleSource);

  return connectDeviceUseCase({
    ...input,
    deviceDiscoveryService: new DefaultDeviceDiscoveryService<MobileDiscoveryError>(
      discoverySources,
    ),
    matchDiscoveredDevices: filterMatchedDevices,
    mapConnectionError: createConnectionError,
  });
}
