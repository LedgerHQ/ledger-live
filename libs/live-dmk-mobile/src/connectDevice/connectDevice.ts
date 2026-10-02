import type { DeviceManagementKit, TransportIdentifier } from "@ledgerhq/device-management-kit";
import {
  connectDeviceUseCase,
  DefaultDeviceDiscoveryService,
  type DeviceDiscoverySource,
  type DeviceConnectionResult,
  type KnownDevice,
} from "@ledgerhq/live-dmk-shared";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { getEnv } from "@shared/env";
import type { Observable } from "rxjs";

import type { MobileDiscoveryError } from "../deviceConnectivity/types";
import type { MobileConnectDeviceUIState } from "./types";
import { MockServerDeviceDiscoverySource } from "../deviceConnectivity/discoveryService/sources/MockServerDeviceDiscoverySource";
import { RnBleDeviceDiscoverySource } from "../deviceConnectivity/discoveryService/sources/RnBleDeviceDiscoverySource";
import { RnHidDeviceDiscoverySource } from "../deviceConnectivity/discoveryService/sources/RnHidDeviceDiscoverySource";
import { SpeculosDeviceDiscoverySource } from "../deviceConnectivity/discoveryService/sources/SpeculosDeviceDiscoverySource";
import { buildMobileCompatDeviceId, createConnectionError, filterMatchedDevices } from "./utils";

export type ConnectDeviceInput = {
  knownDevices: Array<KnownDevice>;
  acceptedDeviceModelIds?: Array<DeviceModelId>;
  dmk: DeviceManagementKit;
  onConnected: (result: DeviceConnectionResult) => void;
};

export function connectDevice(input: ConnectDeviceInput): Observable<MobileConnectDeviceUIState> {
  const rnHidSource = new RnHidDeviceDiscoverySource(input.dmk);
  const rnBleSource = new RnBleDeviceDiscoverySource(input.dmk);
  const speculosSource = new SpeculosDeviceDiscoverySource(input.dmk);
  const discoverySources: Map<
    TransportIdentifier,
    DeviceDiscoverySource<MobileDiscoveryError>
  > = new Map();
  discoverySources.set(rnHidSource.transportId, rnHidSource);
  discoverySources.set(rnBleSource.transportId, rnBleSource);
  discoverySources.set(speculosSource.transportId, speculosSource);
  if (getEnv("MOCK_SERVER_TRANSPORT")) {
    const mockServerSource = new MockServerDeviceDiscoverySource(input.dmk);
    discoverySources.set(mockServerSource.transportId, mockServerSource);
  }

  return connectDeviceUseCase({
    ...input,
    deviceDiscoveryService: new DefaultDeviceDiscoveryService<MobileDiscoveryError>(
      discoverySources,
    ),
    matchDiscoveredDevices: filterMatchedDevices,
    mapConnectionError: createConnectionError,
    buildCompatDeviceId: buildMobileCompatDeviceId,
  });
}
