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

import type { MobileDiscoveryError } from "../deviceConnectivity/types";
import type { MobileConnectDeviceUIState } from "./types";
import { MockServerDeviceDiscoverySource } from "../deviceConnectivity/discoveryService/sources/MockServerDeviceDiscoverySource";
import { isMockServerTransportEnabled } from "../mockServerTransportConfig";
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
  const discoverySources: Map<
    TransportIdentifier,
    DeviceDiscoverySource<MobileDiscoveryError>
  > = new Map();

  // A Bluetooth error stops every source. The iOS simulator has no Bluetooth, so the
  // mock-server session must be the only source or the test stops on that error.
  if (isMockServerTransportEnabled()) {
    const mockServerSource = new MockServerDeviceDiscoverySource(input.dmk);
    discoverySources.set(mockServerSource.transportId, mockServerSource);
  } else {
    const rnHidSource = new RnHidDeviceDiscoverySource(input.dmk);
    const rnBleSource = new RnBleDeviceDiscoverySource(input.dmk);
    const speculosSource = new SpeculosDeviceDiscoverySource(input.dmk);
    discoverySources.set(rnHidSource.transportId, rnHidSource);
    discoverySources.set(rnBleSource.transportId, rnBleSource);
    discoverySources.set(speculosSource.transportId, speculosSource);
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
